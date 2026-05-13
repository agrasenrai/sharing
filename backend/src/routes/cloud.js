const express = require('express');
const router = express.Router();
const cloudinary = require('../config/cloudinary');
const axios = require('axios');
const archiver = require('archiver');

function normalizePublicId(raw) {
  if (!raw) return raw;
  let id = decodeURIComponent(raw);
  // Remove leading slashes
  id = id.replace(/^\/+/, '');
  // Remove 'upload/' prefix if present (SDK bug)
  id = id.replace(/^upload\//, '');
  id = id.replace(/\/upload\//, '/');
  // Keep folder prefix intact - Cloudinary stores public_id as folder/filename
  return id;
}

function buildDownloadName(resource) {
  const baseName = (resource && (resource.original_filename || resource.public_id || 'download'))
    .toString()
    .split('/')
    .pop()
    .replace(/[<>:"/\\|?*]+/g, '_');
  const extension = resource && resource.format ? resource.format : 'jpg';
  return `${baseName}.${extension}`;
}

// Create a signature for client upload (no auth for simple public private setups)
router.post('/sign', express.json(), (req, res) => {
  try {
    const timestamp = Math.round(Date.now() / 1000);
    const paramsToSign = { timestamp };
    if (req.body && req.body.folder) paramsToSign.folder = req.body.folder;
    const signature = cloudinary.utils.api_sign_request(paramsToSign, process.env.CLOUDINARY_API_SECRET);
    res.json({ signature, timestamp, api_key: process.env.CLOUDINARY_API_KEY, cloud_name: process.env.CLOUDINARY_CLOUD_NAME });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// List resources in an optional folder using Cloudinary Search API
router.get('/list', async (req, res) => {
  try {
    const folder = req.query.folder;
    let expression = '';
    if (folder) expression = `folder:${folder}/*`;
    const q = cloudinary.search.expression(expression || undefined).sort_by('uploaded_at', 'desc').max_results(200);
    const result = await q.execute();
    res.json(result.resources || []);
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
}
})

router.get('/download/:publicId', async (req, res) => {
  try {
    const { publicId: rawId } = req.params
    const publicId = normalizePublicId(rawId)
    const resourceType = req.query.resource_type || 'image'
    const format = req.query.format || 'jpg'
    const fileName = req.query.filename || `${publicId.split('/').pop() || 'download'}.${format}`
    const url = cloudinary.url(publicId, { secure: true, resource_type: resourceType, format })
    if (!url) return res.status(404).json({ error: 'not found' })
    const r = await axios.get(url, { responseType: 'stream' })
    res.setHeader('Content-Type', r.headers['content-type'] || 'application/octet-stream')
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`)
    r.data.pipe(res)
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: e.message })
  }
})

router.get('/get/:publicId', async (req, res) => {
  try {
    const { publicId: rawId } = req.params
    const publicId = normalizePublicId(rawId)
    const url = cloudinary.url(publicId, { secure: true })
    if (!url) return res.status(404).json({ error: 'not found' })
    const sign = req.query.sign === '1' || req.query.sign === 'true'
    let signed_url = null
    if (sign) {
      signed_url = cloudinary.url(publicId, { sign_url: true, secure: true })
    }
    res.json({ url, signed_url })
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: e.message })
  }
})

router.delete('/delete/:publicId', async (req, res) => {
  try {
    const { publicId: rawId } = req.params
    const publicId = normalizePublicId(rawId)
    const folder = req.query.folder
    const resourceType = req.query.resource_type || 'image'
    if (folder && !publicId.startsWith(folder + '/')) {
      return res.status(403).json({ error: 'resource not in specified folder' })
    }
    const result = await cloudinary.uploader.destroy(publicId, { resource_type: resourceType })
    res.json({ ok: true, result })
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: e.message })
  }
})

router.get('/download-all', async (req, res) => {
  try {
    const folder = req.query.folder
    if (!folder) {
      return res.status(400).json({ error: 'folder is required' })
    }

    const q = cloudinary.search.expression(`folder:${folder}/*`).sort_by('uploaded_at', 'desc').max_results(200)
    const result = await q.execute()
    const resources = result.resources || []

    if (resources.length === 0) {
      return res.status(404).json({ error: 'no files found' })
    }

    res.setHeader('Content-Type', 'application/zip')
    res.setHeader('Content-Disposition', `attachment; filename="${folder}.zip"`)

    const archive = archiver('zip', { zlib: { level: 9 } })
    archive.on('error', err => {
      console.error(err)
      if (!res.headersSent) {
        res.status(500).json({ error: err.message })
      } else {
        res.destroy(err)
      }
    })

    archive.pipe(res)

    for (const resource of resources) {
      try {
        const downloadUrl = cloudinary.url(resource.public_id, {
          secure: true,
          resource_type: resource.resource_type || 'image',
          format: resource.format || undefined,
        })
        const response = await axios.get(downloadUrl, { responseType: 'stream' })
        archive.append(response.data, { name: buildDownloadName(resource) })
      } catch (err) {
        console.error(`Failed to add ${resource.public_id} to zip`, err.message)
      }
    }

    await archive.finalize()
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: e.message })
  }
})

module.exports = router
