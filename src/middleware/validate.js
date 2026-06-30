// File: src/middleware/validate.js

/**
 * Pabrik middleware validasi Joi yang dapat dipakai ulang.
 * @param {import('joi').Schema} schema - Schema Joi untuk validasi
 * @param {'body'|'query'|'params'} source - Lokasi data yang divalidasi
 */
const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[source], {
      abortEarly: false,   // Kumpulkan SEMUA error, bukan berhenti di error pertama
      stripUnknown: true,  // Hapus field yang tidak ada di schema (keamanan)
      convert: true,       // Konversi tipe otomatis (string '10' → number 10)
    });

    if (error) {
      const details = error.details.map(d => ({
        field: d.path.join('.'),
        message: d.message,
      }));
      console.error('JOI VALIDATION ERROR:', JSON.stringify(details, null, 2));
      console.error('PAYLOAD:', req[source]);
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Data yang dikirim tidak valid.',
          details,
        },
      });
    }

    // Ganti req[source] dengan nilai yang sudah divalidasi & dibersihkan
    req[source] = value;
    next();
  };
};

module.exports = validate;
