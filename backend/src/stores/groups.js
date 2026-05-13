// Simple in-memory groups store. Replace with DB-backed models later.
// Group shape: { id: string, name: string, members: [email], owner: email }
const groups = new Map();

module.exports = groups;
