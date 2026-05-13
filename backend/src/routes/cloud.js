const express = require('express');
const router = express.Router();
const cloudinary = require('../config/cloudinary');
const axios = require('axios');

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
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/download/:publicId', async (req, res) => {
  try {
    const { publicId: rawId } = req.params;
    const publicId = normalizePublicId(rawId);
    // Use SDK to generate URL - handles folder paths correctly
    const url = cloudinary.url(publicId, { secure: true });
    if (!url) return res.status(404).json({ error: 'not found' });
    const r = await axios.get(url, { responseType: 'stream' });
    res.setHeader('Content-Type', r.headers['content-type'] || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${publicId}"`);
    r.data.pipe(res);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

// Return resource metadata (no streaming) and optional signed URL
router.get('/get/:publicId', async (req, res) => {
  try {
    const { publicId: rawId } = req.params;
    const publicId = normalizePublicId(rawId);
    // Use SDK to generate URL - handles folder paths correctly
    const url = cloudinary.url(publicId, { secure: true });
    if (!url) return res.status(404).json({ error: 'not found' });
    const sign = req.query.sign === '1' || req.query.sign === 'true';
    let signed_url = null;
    if (sign) {
      signed_url = cloudinary.url(publicId, { sign_url: true, secure: true });
    }
    res.json({ url, signed_url });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

// Delete a resource (only if it belongs to provided folder query param)
router.delete('/delete/:publicId', async (req, res) => {
  try {
    const { publicId: rawId } = req.params;
    const publicId = normalizePublicId(rawId);
    const folder = req.query.folder;
    // If folder is specified, verify the public_id starts with that folder
    if (folder) {
      if (!publicId.startsWith(folder + '/')) {
        return res.status(403).json({ error: 'resource not in specified folder' });
      }
    }
    // Use SDK destroy directly - it handles folder paths in public_id correctly
    const result = await cloudinary.uploader.destroy(publicId);
    res.json({ ok: true, result });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
