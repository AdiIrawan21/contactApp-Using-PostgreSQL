/* ========================================== import module ======================================= */
const express = require("express"); // import module express.js
const app = express(); // membuat aplikasi express
const expressLayouts = require("express-ejs-layouts"); // import module express-ejs-layouts
const host = "localhost";
const port = 3000; // konfigurasi port
const { ambilData, tambahData, cekData, findData, hapusData, updateData } = require("./utility/function"); //import module function.js
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

// ================================================ Route add contact =============================================== //

app.get("/contact/add", (req, res) => {
  res.render("add-contact", {
    title: "Page Add Contact",
    layout: "layout/main",
  });
});

//data contact proccess
app.post(
  '/contact',
  [
    body('nama').custom(async (value) => {
      const cek = await cekData(value);

      if (cek) {
        throw new Error('Data Nama sudah terdaftar.');
      } else {
        return true;
      }
    }),
    check('email', 'Format Email salah.').isEmail(),
    check('mobile', 'Format NoTelp salah harap masukkan sesuai format IDN.').isMobilePhone(),
  ],
  async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      res.render('add-contact', {
        title: 'Page Add Data',
        layout: 'layout/main',
        errors: errors.array(),
      });
    } else {
      try {
        await tambahData(req.body.nama, req.body.mobile, req.body.email); // menggunakan fungsi tambahData dari function.js
        req.flash('msg', 'Data Contact Baru Berhasil Ditambahkan!');
        res.redirect('/contact');
      } catch (err) {
        console.error(err.message);
        req.flash('msg', err.message);
        res.redirect('/contact');
      }
    }
  }
);

// ================================================ END =============================================== //




// ========================= Route detail contact ============================== //

app.get('/contact/:nama', async (req, res) => {
  try {
    // Menemukan data berdasarkan nama untuk ditampilkan dalam halaman detail
    const contact = await findData(req.params.nama);

    // Menampilkan halaman detail-contact dengan data yang ditemukan
    res.render('detail', {
      title: 'Detail Contact',
      layout: 'layout/main',
      contact,
    });
  } catch (err) {
    console.error(err.message);

    // Menampilkan pesan flash jika terjadi kesalahan
    req.flash('msg', 'Terjadi kesalahan saat mengambil data untuk detail.');

    // Redirect ke halaman contact
    res.redirect('/contact');
  }
});


// =================================== END =================================== //



// ========================= Route delete contact ============================== //
app.get('/contact/delete/:nama', async (req, res) => {
  try {
    // Menemukan data sebelum dihapus (opsional, tergantung kebutuhan)
    await findData(req.params.nama);

    // Menghapus data
    await hapusData(req.params.nama);

    // Menampilkan pesan flash
    req.flash('msg', 'Data Contact Berhasil Dihapus!');

    // Redirect ke halaman contact
    res.redirect('/contact');
  } catch (err) {
    console.error(err.message);

    // Menampilkan pesan flash jika terjadi kesalahan
    req.flash('msg', 'Terjadi kesalahan saat menghapus data.');

    // Redirect ke halaman contact
    res.redirect('/contact');
  }
});

// ================================= END ====================================== //



// =========================================== Route update contact ============================================ //
app.get("/contact/update/:nama", async (req, res) => {
  try {
    // Menemukan data berdasarkan nama untuk ditampilkan dalam form update
    const contact = await findData(req.params.nama);

    // Menampilkan halaman update-contact dengan data yang ditemukan
    if (contact) {
      res.render('update-contact', {
        title: 'Update Contact',
        layout: 'layout/main',
        contact,
        oldNama: req.params.nama,
      });
    } else {
      // Jika data kontak tidak ditemukan, redirect ke halaman contact
      req.flash('msg', 'Data kontak tidak ditemukan.');
      res.redirect('/contact');
    }
  } catch (err) {
    console.error(err.message);

    // Menampilkan pesan flash jika terjadi kesalahan
    req.flash('msg', 'Terjadi kesalahan saat mengambil data untuk update.');
    
    // Redirect ke halaman contact
    res.redirect('/contact');
  }
});

// proses update data
app.post('/contact/update', [
  body('nama').custom(async (value, { req }) => {
    // Menggunakan await untuk memanggil cekNama
    const cek = await cekData(value);

    if (value !== req.body.oldNama && cek) {
      throw new Error('Data Nama sudah terdaftar.');
    }
    return true;
  }),
  check('mobile', 'Phone Number is Wrong.').isMobilePhone('id-ID'),
  check('email', 'Email format is wrong.').isEmail(),
], async (req, res) => {
  try {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      res.render('update-contact', {
        title: 'Update Contact',
        layout: 'layout/main',
        errors: errors.array(),
        contact: req.body,
      });
    } else {
      updateData(req.body);
      req.flash('msg', 'Data Contact Berhasil di Update.');
      res.redirect('/contact');
    }
  } catch (err) {
    console.error(err.message);

    req.flash('msg', 'Terjadi kesalahan saat update data.');
    res.redirect('/contact');
  }
});

// ================================================ END ======================================================= //

// route error handling jika tidak sesuai, maka akan menampilkan page not found
app.use("/", (req, res) => {
  res.status(404);
  res.send("Page not found : 404");
});

app.listen(port, host, () => {
  console.log(`Server running at http://${host}:${port}`); // menampilkan pesan bahwa port sedang berjalan
});
