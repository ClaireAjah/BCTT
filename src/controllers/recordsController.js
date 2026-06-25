const supabase = require('../config/db');

exports.addMedicalRecord = async (req, res, next) => {
    try {
        if (req.user.role !== 'doctor' && req.user.role !== 'admin') {
            const error = new Error('Akses ditolak');
            error.statusCode = 403;
            throw error;
        }

        const { patient_id, appointment_id, diagnosis, prescription } = req.body;
        const doctor_id = req.user.id;

        if (!patient_id || !diagnosis || !prescription) {
            const error = new Error('Semua field rekam medis wajib diisi');
            error.statusCode = 400;
            throw error;
        }

        const { data, error } = await supabase
            .from('medical_records')
            .insert([{ patient_id, doctor_id, appointment_id, diagnosis, prescription }])
            .select()
            .single();

        if (error) throw error;

        res.status(201).json({
            success: true,
            data
        });
    } catch (err) {
        next(err);
    }
};

exports.getMedicalRecords = async (req, res, next) => {
    try {
        let query = supabase.from('medical_records').select(`
            *,
            patient:users!patient_id(full_name),
            doctor:users!doctor_id(full_name)
        `).order('created_at', { ascending: false });

        if (req.user.role === 'patient') {
            query = query.eq('patient_id', req.user.id);
        } else if (req.user.role === 'doctor') {
            if (req.query.patient_id) {
                query = query.eq('patient_id', req.query.patient_id);
            } else {
                query = query.eq('doctor_id', req.user.id);
            }
        } else if (req.query.patient_id) {
            query = query.eq('patient_id', req.query.patient_id);
        }

        const { data, error } = await query;
        if (error) throw error;

        res.json({
            success: true,
            data
        });
    } catch (err) {
        next(err);
    }
};
