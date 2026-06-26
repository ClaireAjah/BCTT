const supabase = require('../config/db');

exports.createAnnouncement = async (req, res, next) => {
    try {
        if (req.user.role !== 'doctor' && req.user.role !== 'admin') {
            const error = new Error('Akses ditolak');
            error.statusCode = 403;
            throw error;
        }

        const { title, content, type } = req.body;

        if (!title || !content || !type) {
            const error = new Error('Semua field pengumuman wajib diisi');
            error.statusCode = 400;
            throw error;
        }

        const { data, error } = await supabase
            .from('announcements')
            .insert([{ title, content, type }])
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

exports.getAnnouncements = async (req, res, next) => {
    try {
        const { data, error } = await supabase
            .from('announcements')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        res.json({
            success: true,
            data
        });
    } catch (err) {
        next(err);
    }
};
