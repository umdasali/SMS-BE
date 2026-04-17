import { Request, Response } from 'express';
import Certificate from '../models/Certificate';
import Student from '../models/Student';
import { sendSuccess, sendError } from '../utils/response';
import { v4 as uuidv4 } from 'uuid';

export const getCertificates = async (req: Request, res: Response): Promise<void> => {
  try {
    const { type, status, studentId, search, page = '1', limit = '20' } = req.query as Record<string, string>;
    const filter: Record<string, unknown> = { tenantId: req.tenantId };
    if (type) filter['type'] = type;
    if (status) filter['status'] = status;
    if (studentId) filter['studentId'] = studentId;

    if (search) {
      const matchingStudents = await Student.find({
        tenantId: req.tenantId,
        name: { $regex: search, $options: 'i' }
      }).select('_id');
      const studentIds = matchingStudents.map(s => s._id);

      filter['$or'] = [
        { serialNo: { $regex: search, $options: 'i' } },
        { studentId: { $in: studentIds } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [certs, total] = await Promise.all([
      Certificate.find(filter)
        .populate('studentId', 'name admissionNo classId')
        .populate('issuedBy', 'name')
        .skip(skip).limit(parseInt(limit)).sort({ createdAt: -1 }),
      Certificate.countDocuments(filter)
    ]);

    sendSuccess(res, { certificates: certs, total, page: parseInt(page), limit: parseInt(limit) }, 'Certificates fetched');
  } catch (err) {
    sendError(res, 'Failed to fetch certificates', 500, err);
  }
};

export const generateCertificate = async (req: Request, res: Response): Promise<void> => {
  try {
    const { studentId, type, content } = req.body as {
      studentId: string; type: string; content: Record<string, unknown>;
    };

    if (!studentId || studentId === 'null') {
      sendError(res, 'Please select a valid student. studentId cannot be null.', 400);
      return;
    }

    const student = await Student.findOne({ _id: studentId, tenantId: req.tenantId });
    if (!student) { sendError(res, 'Student not found', 404); return; }

    const serialNo = `CERT-${type.toUpperCase().slice(0, 3)}-${Date.now()}-${uuidv4().slice(0, 6).toUpperCase()}`;

    const certificate = await Certificate.create({
      tenantId: req.tenantId,
      studentId,
      type,
      content: content || {},
      issuedDate: new Date(),
      issuedBy: req.user?._id,
      serialNo,
    });

    const populated = await certificate.populate('studentId', 'name admissionNo classId');
    sendSuccess(res, populated, 'Certificate generated', 201);
  } catch (err) {
    sendError(res, 'Failed to generate certificate', 500, err);
  }
};

export const getStudentCertificates = async (req: Request, res: Response): Promise<void> => {
  try {
    const certs = await Certificate.find({
      tenantId: req.tenantId,
      studentId: req.params['id'],
    })
      .populate('studentId', 'name admissionNo')
      .populate('issuedBy', 'name')
      .sort({ createdAt: -1 });
    sendSuccess(res, certs, 'Certificates fetched');
  } catch (err) {
    sendError(res, 'Failed to fetch certificates', 500, err);
  }
};

export const getCertificate = async (req: Request, res: Response): Promise<void> => {
  try {
    const cert = await Certificate.findOne({ _id: req.params['id'], tenantId: req.tenantId })
      .populate('studentId', 'name admissionNo classId dob')
      .populate('issuedBy', 'name designation');
    if (!cert) { sendError(res, 'Certificate not found', 404); return; }
    sendSuccess(res, cert, 'Certificate fetched');
  } catch (err) {
    sendError(res, 'Failed to fetch certificate', 500, err);
  }
};

export const revokeCertificate = async (req: Request, res: Response): Promise<void> => {
  try {
    const cert = await Certificate.findOneAndUpdate(
      { _id: req.params['id'], tenantId: req.tenantId },
      { status: 'revoked' },
      { new: true }
    );
    if (!cert) { sendError(res, 'Certificate not found', 404); return; }
    sendSuccess(res, cert, 'Certificate revoked');
  } catch (err) {
    sendError(res, 'Failed to revoke certificate', 500, err);
  }
};

export const getMyCertificates = async (req: Request, res: Response): Promise<void> => {
  try {
    const student = await Student.findOne({ userId: req.user?._id });
    if (!student) { sendError(res, 'Student profile not found', 404); return; }

    const certs = await Certificate.find({ studentId: student._id, status: 'issued' })
      .populate('issuedBy', 'name')
      .sort({ createdAt: -1 });
    sendSuccess(res, certs, 'Certificates fetched');
  } catch (err) {
    sendError(res, 'Failed to fetch certificates', 500, err);
  }
};

export const deleteCertificate = async (req: Request, res: Response): Promise<void> => {
  try {
    const cert = await Certificate.findOneAndDelete({ _id: req.params['id'], tenantId: req.tenantId });
    if (!cert) { sendError(res, 'Certificate not found', 404); return; }
    sendSuccess(res, null, 'Certificate deleted');
  } catch (err) {
    sendError(res, 'Failed to delete certificate', 500, err);
  }
};
