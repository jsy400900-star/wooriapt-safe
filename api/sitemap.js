"use strict";

/*
  아파트 사이트맵 인덱스
  --------------------------------
  /sitemap.xml
      ↓
  /api/sitemap
      ↓
  /sitemaps/apartments-1.xml
  /sitemaps/apartments-2.xml
  ...
*/

const SUPABASE_URL =
  "https://dcysjuxyjqtvkihdsjvv.supabase.co";

const SUPABASE_KEY =
  "여기에_기존_APT_SUPABASE_KEY_값";

const SITE_ORIGIN =
  "https://www.wooriapt.app";

const ROWS_PER_SITEMAP = 1000;


module.exports = async function handler(
  req,
  res
) {

  if (req.method !== "GET") {
    return res
      .status(405)
      .send("Method Not Allowed");
  }


  try {

    const response =
      await fetch(
        SUPABASE_URL +
        "/rest/v1/safe_apartments?select=단지명",
        {
          method: "GET",

          headers: {
            apikey:
              SUPABASE_KEY,

            Authorization:
              "Bearer " +
              SUPABASE_KEY,

            Prefer:
              "count=exact",

            Range:
              "0-0"
          }
        }
      );


    if (!response.ok) {

      const errorText =
        await response.text();

      console.error(
        "SITEMAP COUNT ERROR:",
        response.status,
        errorText
      );


      return res
        .status(502)
        .send(
          "Sitemap count error"
        );
    }


    const contentRange =
      response.headers.get(
        "content-range"
      ) || "0/0";


    const totalCount =
      Number(
        contentRange
          .split("/")
          .pop()
      ) || 0;


    const pages =
      Math.max(
        1,
        Math.ceil(
          totalCount /
          ROWS_PER_SITEMAP
        )
      );


    let sitemapItems = "";


    for (
      let page = 1;
      page <= pages;
      page += 1
    ) {

      sitemapItems +=
        "<sitemap>" +
          "<loc>" +
            SITE_ORIGIN +
            "/sitemaps/apartments-" +
            page +
            ".xml" +
          "</loc>" +
        "</sitemap>";
    }


    res.setHeader(
      "Content-Type",
      "application/xml; charset=utf-8"
    );


    res.setHeader(
      "Cache-Control",
      "s-maxage=86400, stale-while-revalidate=604800"
    );


    return res
      .status(200)
      .send(
        '<?xml version="1.0" encoding="UTF-8"?>' +
        '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' +
        sitemapItems +
        "</sitemapindex>"
      );


  } catch (error) {

    console.error(
      "SITEMAP INDEX ERROR:",
      error
    );


    return res
      .status(500)
      .send(
        "Sitemap error"
      );
  }
};
