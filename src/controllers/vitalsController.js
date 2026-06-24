const supabase = require('../config/db');

exports.addVitals = async (req, res, next) => {
    try {
        const { blood_pressure, heart_rate, blood_sugar, weight } = req.body;
        const patient_id = req.user.id;

        if (!blood_pressure || !heart_rate || !blood_sugar || !weight) {
            const error = new Error('Semua field vital wajib diisi');
            error.statusCode = 400;
            throw error;
        }

        const { data, error } = await supabase
            .from('vitals')
            .insert([{ patient_id, blood_pressure, heart_rate, blood_sugar, weight }])
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

exports.getVitals = async (req, res, next) => {
    try {
        let query = supabase.from('vitals').select('*').order('recorded_at', { ascending: true });

        if (req.user.role === 'patient') {
            query = query.eq('patient_id', req.user.id);
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
