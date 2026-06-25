const supabase = require('../config/db');

exports.createAppointment = async (req, res, next) => {
    try {
        const { doctor_id, appointment_date, reason } = req.body;
        const patient_id = req.user.id;

        if (!doctor_id || !appointment_date || !reason) {
            const error = new Error('Semua field wajib diisi');
            error.statusCode = 400;
            throw error;
        }

        const { data, error } = await supabase
            .from('appointments')
            .insert([{ patient_id, doctor_id, appointment_date, reason }])
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

exports.getAppointments = async (req, res, next) => {
    try {
        let query = supabase.from('appointments').select(`
            *,
            patient:users!patient_id(full_name),
            doctor:users!doctor_id(full_name)
        `).order('appointment_date', { ascending: true });

        if (req.user.role === 'patient') {
            query = query.eq('patient_id', req.user.id);
        } else if (req.user.role === 'doctor') {
            query = query.eq('doctor_id', req.user.id);
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

exports.updateAppointmentStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (req.user.role !== 'doctor' && req.user.role !== 'admin') {
            const error = new Error('Akses ditolak');
            error.statusCode = 403;
            throw error;
        }

        const { data, error } = await supabase
            .from('appointments')
            .update({ status })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        res.json({
            success: true,
            data
        });
    } catch (err) {
        next(err);
    }
};
