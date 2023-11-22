/* ========================================== import module ======================================= */
const express = require("express"); // import module express.js
const app = express(); // membuat aplikasi express
const expressLayouts = require("express-ejs-layouts"); // import module express-ejs-layouts
const host = "localhost";
const port = 3000; // konfigurasi port
const { ambilData, findData, tambahData, cekNama, hapusData, updateData } = require("./utility/function"); //import module function.js
const { body, check, validationResult } = require("express-validator"); // import module express validator, untuk melakukan unique pada data nama
const cookieParser = require("cookie-parser"); // import module cookie-parser
const flash = require("connect-flash"); // import module connect-flash
const session = require("express-session"); // import module express-session
const pool = require("./koneksi") // call database
/* ============================================ END =============================================== */

app.set("view engine", "ejs"); //informasi menggunakan ejs
app.use(expressLayouts); // Mengaktifkan fitur layout
app.use(express.static("views")); // untuk memanggil folder/file css, javascript.
app.use(express.urlencoded({ extended: true })); //menggunakan middleware express.urlencoded().
app.use(express.json()) // req.body
app.use(flash()); // mengaktifkan fitur flash

// config flash
app.use(cookieParser("secret"));
app.use(
  session({
    cookie: { maxAge: 6000 },
    secret: "secret",
    resave: true,
    saveUninitialized: true,
  })
);


// route ke halaman index/home
app.get("/", (req, res) => {
  res.render("index", {
    title: "Page Home",
    layout: "layout/main",
  });
});

// route ke halaman about
app.get("/about", (req, res) => {
  res.render("about", {
    title: "Page About",
    layout: "layout/main",
  });
});

// route ke halaman contact, menampilkan list contact pada table db
app.get("/contact", async (req, res) => {
  // Mencoba mengambil data contact dari database PostgreSQL
  try {
    // Menjalankan kueri SQL untuk mengambil semua contact
    const contactList = await pool.query("SELECT * FROM contacts");
    // Mengambil data contact dari hasil kueri ke dalam variabel contacts
    const contacts = contactList.rows;

    // Menampilkan halaman contact dengan data yang diambil
    res.render("contact", {
      title: "Page Contact",
      layout: "layout/main",
      contacts,
      msg: req.flash("msg"),
    });
  } catch (err) {
    // Menangani kesalahan yang terjadi selama operasi database
    // Mencatat pesan kesalahan ke konsol
    console.error(err.message);
    // Menampilkan halaman contact dengan array contacts kosong
    res.render("contact", {
      title: "Page Contact",
      layout: "layout/main",
      contacts: [],
      msg: req.flash("msg"),
    });
  }
});



// route ke halaman add data contact
app.get("/contact/add", (req, res) => {
  res.render("add-contact", {
    title: "Page Add Contact",
    layout: "layout/main",
  });
});

//data contact proccess
app.post(
  "/contact",
  // melakukan pengecekan data nama, jika data nama sudah tersedia di daftar contact.json
  [
    body("nama").custom((value) => {
      const cek = cekNama(value); // deklarasi variabel cek untuk mengetahui apakah ada duplikat atau tidak
      console.log(cek);

      // melakukan pengkondisian pada variabel cek
      if (cek) {
        throw new Error("Data Nama sudah terdaftar."); // jika nama yang diinputkan pada form sudah terdaftar maka akan muncul pesan
      } else {
        return true; // jika belum terdaftar, maka akan mengembalikan nilai true
      }
    }),
    // validasi email dan mobile
    check("mobile", "Phone Number is Wrong.").isMobilePhone(),
    check("email", "Email format is wrong.").isEmail(),
  ],
  (req, res) => {
    const errors = validationResult(req); // akan mengambil hasil validasi dari middleware express-validator.
    if (!errors.isEmpty()) {
      res.render("add-contact", {
        title: "Page Add Data",
        layout: "layout/main",
        errors: errors.array(), // akan merender tampilan "add-contact" lagi, dengan meneruskan array kesalahan validasi ke tampilan.
      });
    } else {
      // jika tidak, akan memanggil fungsi tambahData() untuk menambahkan data kontak baru ke contacts.json
      tambahData(req.body);
      req.flash("msg", "Data Contact Baru Berhasil Ditambahkan!");
      res.redirect("/contact");
    }
  }
);

// route ke halaman detail dari contact
app.get("/contact/:nama", async (req, res) => {
  // Ambil nama contact dari URL query string
  const nama = req.params.nama;

  // Cari data contact berdasarkan nama
  const contacts = await ambilData();

  // Temukan objek contact berdasarkan nama
  const contact = contacts.find((contact) => contact.nama === nama);

  // Render halaman detail contact dengan data yang diambil
  res.render("detail", {
    contact,
    title: "Page Detail Contact",
    layout: "layout/main",
  });
});



// route untuk delete contact
app.get("/contact/delete/:nama", (req, res) => {
  findData(req.params.nama);
  hapusData(req.params.nama);
  req.flash("msg", "Data Contact Berhasil Dihapus!");
  res.redirect("/contact");
});

// form ubah data contact
app.get("/contact/update/:nama", (req, res) => {
  const contact = findData(req.params.nama);

  res.render("update-contact", {
    title: "Page Edit Contact",
    layout: "layout/main",
    contact,
  });
});

// proses update data
app.post(
  "/contact/update",
  [
    body("nama").custom((value, { req }) => {
      const cek = cekNama(value); // deklarasi variabel cek untuk mengetahui apakah ada duplikat atau tidak

      // melakukan pengkondisian pada variabel cek
      if (value !== req.body.oldNama && cek) {
        throw new Error("Data Nama sudah terdaftar."); // jika nama yang diinputkan pada form sudah terdaftar maka akan muncul pesan
      }
      return true; // jika belum terdaftar, maka akan mengembalikan nilai true
    }),
    // validasi email dan mobile
    check("mobile", "Phone Number is Wrong.").isMobilePhone("id-ID"),
    check("email", "Email format is wrong.").isEmail(),
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.render("update-contact", {
        title: "Page Update Contact",
        layout: "layout/main",
        errors: errors.array(),
        contact: req.body,
      });
    } else {
      updateData(req.body);
      req.flash("msg", "Data Contact Berhasil di Update.");
      res.redirect("/contact");
    }
  }
);

// route error handling jika tidak sesuai, maka akan menampilkan page not found
app.use("/", (req, res) => {
  res.status(404);
  res.send("Page not found : 404");
});

app.listen(port, host, () => {
  console.log(`Server running at http://${host}:${port}`); // menampilkan pesan bahwa port sedang berjalan
});
