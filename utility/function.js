const fs = require("fs");
const pool = require("../koneksi") // call database
//const validator = require("validator");

// Membuat folder "data" jika belum ada
const dirPath = "./data";
if (!fs.existsSync(dirPath)) {
  fs.mkdirSync(dirPath);
}

// Membuat file "contacts.json" jika belum ada
const dataPath = "./data/contacts.json";
if (!fs.existsSync(dataPath)) {
  fs.writeFileSync(dataPath, "[]", "utf-8");
}

// mengambil data yang disimpan di db
const ambilData = async () => {
  const connection = await pool.connect();
  const query = `SELECT * FROM contacts`;
  const results = await connection.query(query);
  const contacts = results.rows;
  return contacts;
};

// menyimpan data json ke variabel saveData
const saveData = (contacts) => {
  fs.writeFileSync(dataPath, JSON.stringify(contacts));
};

// menambahkan data contact
const tambahData = (contact) => {
  const contacts = ambilData();
  contacts.push(contact);
  saveData(contacts);
};

// function untuk delete data
const hapusData = (nama) => {
  const contacts = ambilData();
  const contact = contacts.filter((contact) => contact.nama !== nama);
  saveData(contact);
};

// function untuk update data
const updateData = (newContact) => {
  const contacts = ambilData();
  const contactFilter = contacts.filter((contact) => contact.nama !== newContact.oldNama);
  delete newContact.oldNama;
  contactFilter.push(newContact);
  saveData(contactFilter);
};

// membuat validator nama, jika data nama sudah tersedia
const cekNama = (nama) => {
  const contacts = ambilData();
  return (contact = contacts.find((contact) => contact.nama === nama));
};

module.exports = { ambilData, tambahData, cekNama, hapusData, updateData };
