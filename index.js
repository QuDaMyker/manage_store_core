const express = require("express");
const app = express();
const axios = require("axios");
const cheerio = require("cheerio");
const supabaseLib = require("@supabase/supabase-js");
const PORT = 8080;
const supabase = supabaseLib.createClient(
  "https://isxgjyotpvehvflthzuu.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlzeGdqeW90cHZlaHZmbHRoenV1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTQ0ODY2MzIsImV4cCI6MjAzMDA2MjYzMn0.ZvArB9QsH_JaVlwIa7_5FeDxnrvq0tjcH6RgcTELu5g"
);
app.use(express.json());
app.listen(PORT, () => console.log(`it's alive on http://localhost:${PORT}`));

app.get("/tshirt", (req, res) => {
  res.status(200).send({
    tshirt: "🐧",
    size: "large",
  });
});

app.post("/getinfo/id=:id", async (req, res) => {
  const { id } = req.params;
  var barcode;
  var titleSave;
  var imgSave;

  try {
    const response = await axios.get(
      `https://minhcaumart.vn/san-pham/tim-ket-qua.html?keyword=${id}&start=0`
    );
    const $ = cheerio.load(response.data);
    const productInfos = [];

    const productItem = $(".item-product");

    productItem.each((index, element) => {
      const img = $(element)
        .find("img.img-responsive.lazyload")
        .attr("data-src");
      const title = $(element).find(".product-tile").attr("title");

      barcode = id;
      titleSave = title;
      imgSave = `https://minhcaumart.vn${img}`;
      productInfos.push({ barcode, title, imgSave });
      console.log("====================================");
      console.log(productInfos[0]);
      console.log("====================================");
    });

    if (productInfos.length != 0) {
      const { data, error } = await supabase
        .from("product")
        .select("barcode")
        .eq("barcode", `${id}`)
        .limit(1);

      if (data.length == 0) {
        // Thêm dữ liệu vào Supabase nếu không tìm thấy barcode trong database
        const { data, error } = await supabase.from("product").insert({
          barcode: `${id}`,
          title: `${titleSave}`,
          img: `${imgSave}`,
        });

        if (error) {
          throw error;
        }
        console.log("====================================");
        console.log(productInfos[0]);
        console.log("====================================");
        res.send({
          status: 200,
          barcode: productInfos[0]["barcode"],
          title: productInfos[0]["title"],
          img: productInfos[0]["imgSave"],
        }); // Gửi phản hồi thành công
      } else {
        console.log("====================================");
        console.log("Sản phẩm đã tồn tại");
        console.log("====================================");
        res.send({ status: 201, message: "Sản phẩm đã tồn tại" });
      }
    } else {
      res.send({ status: 401, message: "Không tìm thấy sản phẩm" });
    }
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Lỗi server nội bộ" });
  }
});
