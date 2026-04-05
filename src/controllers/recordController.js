const recordService = require("../services/recordService");

function createRecord(req, res, next) {
  try {
    const record = recordService.createRecord(req.body, req.user.id);
    res.status(201).json({ message: "Record created", data: record });
  } catch (err) {
    next(err);
  }
}

function listRecords(req, res, next) {
  try {
    const result = recordService.listRecords(req.query);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

function getRecord(req, res, next) {
  try {
    const record = recordService.getRecordById(req.params.id);
    res.json({ data: record });
  } catch (err) {
    next(err);
  }
}

function updateRecord(req, res, next) {
  try {
    const updated = recordService.updateRecord(req.params.id, req.body);
    res.json({ message: "Record updated", data: updated });
  } catch (err) {
    next(err);
  }
}

function deleteRecord(req, res, next) {
  try {
    const result = recordService.softDeleteRecord(req.params.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = { createRecord, listRecords, getRecord, updateRecord, deleteRecord };
