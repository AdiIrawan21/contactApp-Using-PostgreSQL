const pool = require("../koneksi") // call database


// mengambil data yang disimpan di db
const ambilData = async () => {
  // Membuka koneksi ke database menggunakan pool connection
  const connection = await pool.connect();
  // Membuat kueri SQL untuk mengambil semua data dari tabel contacts
  const query = `SELECT * FROM contacts`;
  // Menjalankan kueri SQL untuk mengambil data
  const results = await connection.query(query);
  // Menutup koneksi ke database
  connection.release();
  // Mengambil hasil kueri (data contact) dari baris hasil
  const contacts = results.rows;
  // Mengembalikan data contact
  return contacts;
};

// Mendefinisikan fungsi tambahData dengan parameter nama, mobile, dan email
const tambahData = async (nama, mobile, email) => {
  // Membuka koneksi ke database menggunakan pool connection
  const connection = await pool.connect();
  // Membuat kueri SQL untuk menambahkan data ke tabel contacts
  const query = 'INSERT INTO contacts (nama, mobile, email) VALUES ($1, $2, $3) RETURNING *';
  // Menyusun nilai-nilai parameter untuk diikuti pada placeholder kueri SQL
  const values = [nama, mobile, email];
  // Menjalankan kueri SQL dengan nilai-nilai yang telah disusun
  const result = await connection.query(query, values);
  // Menutup koneksi ke database
  connection.release();
  // Mengembalikan data yang baru ditambahkan dari hasil kueri
  return result.rows[0];
  
};

// Mendefinisikan fungsi cekData untuk validasi jika inputan kontak nama sudah tersedia
const cekData = async (nama) => {
  const connection = await pool.connect();

  try {
    // Validasi nama tidak boleh duplikat
    const cekDuplikat = await connection.query('SELECT COUNT(*) FROM contacts WHERE nama = $1', [nama]);
    return cekDuplikat.rows[0].count > 0;
  } finally {
    connection.release();
  }
};

// Mendefinisikan fungsi updateData untuk melakukan update
const updateData = async (updatedContact) => {
  const connection = await pool.connect();

  try {
    // Membuat kueri SQL untuk memperbarui data berdasarkan nama
    const query = `
      UPDATE contacts
      SET nama = $1, mobile = $2, email = $3
      WHERE nama = $4
      RETURNING *;
    `;
    // Menyusun nilai-nilai parameter untuk diikuti pada placeholder kueri SQL
    const values = [
      updatedContact.nama,
      updatedContact.mobile,
      updatedContact.email,
      updatedContact.oldNama, // Menggunakan oldNama sebagai kriteria WHERE
    ];

    // Menjalankan kueri SQL dengan nilai-nilai yang telah disusun
    const result = await connection.query(query, values);

    // Jika data berhasil diperbarui, kembalikan data yang baru
    return result.rows[0];
  } finally {
    // Menutup koneksi ke database, terlepas dari apakah kesalahan terjadi atau tidak
    connection.release();
  }
};


// Mendefinisikan fungsi findData untuk mencari data 
const findData = async (nama) => {
  // Membuka koneksi ke database menggunakan pool connection
  const connection = await pool.connect();

  // error handling untuk mengecek keberhasilan data sudah dihapus atau belum
  try {
    // melakukan kueri data dengan mencari nama
    const query = 'SELECT * FROM contacts WHERE nama = $1';
    // Menjalankan kueri SQL untuk mengambil data
    const result = await connection.query(query, [nama]);
    // Mengembalikan data yang baru ditambahkan dari hasil kueri
    return result.rows[0];
  } finally {
    // Menutup koneksi ke database
    connection.release();
  }
};

const hapusData = async (nama) => {
  // Membuka koneksi ke database menggunakan pool connection
  const connection = await pool.connect();
  try {
    // Melakukan kueri delete data dengan kondisi where nama
    const query = 'DELETE FROM contacts WHERE nama = $1 RETURNING *';
    // Menjalankan kueri SQL untuk menghapus data
    const result = await connection.query(query, [nama]);
    // Mengembalikan data yang baru ditambahkan dari hasil kueri
    return result.rows[0];
  } finally {
     // Menutup koneksi ke database
    connection.release();
  }
};

module.exports = { ambilData, tambahData, cekData, findData, hapusData, updateData};
