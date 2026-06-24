const supabase = require('../config/db');
const jwt = require('jsonwebtoken');
const { JWT_SECRET, JWT_EXPIRES_IN } = require('../middleware/auth');

exports.register = async (req, res, next) => {
    try {
        const { username, password, fullName, email } = req.body;
        if (!username || !password || !fullName || !email) {
            const error = new Error('Semua field wajib diisi');
            error.statusCode = 400;
            throw error;
        }

        const { data: existingUser } = await supabase
            .from('users')
            .select('id')
            .or(`username.eq.${username},email.eq.${email}`)
            .maybeSingle();

        if (existingUser) {
            const error = new Error('Username atau email sudah terdaftar');
            error.statusCode = 409;
            throw error;
        }

        const bcrypt = require('bcryptjs');
        const hashedPassword = await bcrypt.hash(password, 10);

        const { data, error } = await supabase
            .from('users')
            .insert([
                {
                    username,
                    password: hashedPassword,
                    full_name: fullName,
                    email,
                    role: 'patient'
                }
            ])
            .select()
            .single();

        if (error) throw error;

        res.status(201).json({
            success: true,
            message: 'Registrasi berhasil',
            data: { id: data.id, username: data.username, role: data.role }
        });
    } catch (err) {
        next(err);
    }
};

exports.login = async (req, res, next) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            const error = new Error('Username dan password wajib diisi');
            error.statusCode = 400;
            throw error;
        }

        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('username', username)
            .maybeSingle();

        if (error || !user) {
            const err = new Error('Kredensial tidak valid');
            err.statusCode = 401;
            throw err;
        }

        let isMatch = false;
        if (user.password.startsWith('$2a$') || user.password.startsWith('$2b$')) {
            const bcrypt = require('bcryptjs');
            isMatch = await bcrypt.compare(password, user.password);
        } else {
            isMatch = (user.password === password);
        }

        if (!isMatch) {
            const err = new Error('Kredensial tidak valid');
            err.statusCode = 401;
            throw err;
        }

        const payload = {
            id: user.id,
            username: user.username,
            role: user.role
        };

        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 24 * 60 * 60 * 1000 
        });

        res.json({
            success: true,
            message: 'Login berhasil',
            data: payload
        });
    } catch (err) {
        next(err);
    }
};

exports.logout = (req, res) => {
    res.clearCookie('token');
    res.json({ success: true, message: 'Logout berhasil' });
};
