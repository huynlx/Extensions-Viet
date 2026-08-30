const entities = require("entities"); //Import package for decoding HTML entities

import {
  Chapter,
  LanguageCode,
  Manga,
  MangaTile,
  MangaUpdates,
  Tag,
  TagSection,
} from "paperback-extensions-common";

export class Parser {
  protected convertTime(timeAgo: string): Date {
    let time: Date;
    let trimmed: number = Number((/\d*/.exec(timeAgo) ?? [])[0]);
    trimmed = trimmed == 0 && timeAgo.includes("a") ? 1 : trimmed;
    if (timeAgo.includes("giây") || timeAgo.includes("secs")) {
      time = new Date(Date.now() - trimmed * 1000); // => mili giây (1000 ms = 1s)
    } else if (timeAgo.includes("phút")) {
      time = new Date(Date.now() - trimmed * 60000);
    } else if (timeAgo.includes("giờ")) {
      time = new Date(Date.now() - trimmed * 3600000);
    } else if (timeAgo.includes("ngày")) {
      time = new Date(Date.now() - trimmed * 86400000);
    } else if (timeAgo.includes("tháng")) {
      time = new Date(Date.now() - trimmed * 30 * 86400000); // approx. 30 days per month
    } else if (timeAgo.includes("năm")) {
      time = new Date(Date.now() - trimmed * 31556952000);
    } else {
      if (timeAgo.includes(":")) {
        let split = timeAgo.split(" ");
        let H = split[0]; //vd => 21:08
        let D = split[1]; //vd => 25/08
        let fixD = D.split("/");
        let finalD = fixD[1] + "/" + fixD[0] + "/" + new Date().getFullYear();
        time = new Date(finalD + " " + H);
      } else {
        let split = timeAgo.split("/"); //vd => 05/12/18
        time = new Date(split[1] + "/" + split[0] + "/" + "20" + split[2]);
      }
    }
    return time;
  }
  parseMangaDetails($: any, mangaId: string): Manga {
    let tags: Tag[] = [];

    for (let obj of $("li.kind > p.col-xs-8 > a").toArray()) {
      const label = $(obj).text();
      const id = $(obj).attr("href")?.split("/")[4] ?? label;
      tags.push(
        createTag({
          label: label,
          id: id,
        }),
      );
    }

    const creator = $("ul.list-info > li.author > p.col-xs-8").text();
    const image = $("div.col-image > img").attr("src");
    return createManga({
      id: mangaId,
      author: creator,
      artist: creator,
      desc: $("div.detail-content > div > div:nth-last-child(2)").text(),
      titles: [$("h1.title-detail").text()],
      image: image ?? "",
      status: $("li.status > p.col-xs-8")
        .text()
        .toLowerCase()
        .includes("hoàn thành")
        ? 0
        : 1,
      rating: parseFloat($('span[itemprop="ratingValue"]').text()),
      hentai: false,
      tags: [createTagSection({ label: "genres", tags: tags, id: "0" })],
    });
  }

  parseChapterList(data: any[], mangaId: any): Chapter[] {
    const chapters: Chapter[] = [];

    for (const item of data) {
      const formattedView = new Intl.NumberFormat("vi-VN").format(item.view);

      // Dùng Date mặc định của JavaScript để xử lý và format ngày tháng
      const dateObj = item.updated_at
        ? new Date(item.updated_at.replace(" ", "T"))
        : null;

      const formattedTime =
        dateObj && !isNaN(dateObj.getTime())
          ? `${String(dateObj.getDate()).padStart(2, "0")}/${String(dateObj.getMonth() + 1).padStart(2, "0")}/${dateObj.getFullYear()}`
          : "";

      const rawName = item.chapter_name;
      const name = decodeHTMLEntity(rawName);

      chapters.push(
        createChapter({
          id: `${item.chapter_num}/${item.chapter_id}`,
          name: name,
          chapNum: item.chapter_num,
          mangaId: mangaId,
          langCode: LanguageCode.VIETNAMESE,
          time: dateObj && !isNaN(dateObj.getTime()) ? dateObj : new Date(),
          group: formattedTime + " • " + formattedView + " lượt xem",
        }),
      );
    }

    return chapters;
  }

  parseChapterDetails($: any): string[] {
    const pages: string[] = [];

    for (let obj of $(
      "div.reading-detail > div.page-chapter > img",
    ).toArray()) {
      if (!obj.attribs["data-src"]) continue;
      let link = obj.attribs["data-src"];
      if (link.indexOf("http") === -1) {
        //nếu link ko có 'http'
        pages.push(obj.attribs["data-src"]);
      } else {
        pages.push(link);
      }
    }

    return pages;
  }

  parseSearchResults($: any): MangaTile[] {
    const tiles: MangaTile[] = [];

    for (const manga of $("div.item", "div.row").toArray()) {
      const title = $("figure.clearfix > figcaption > h3 > a", manga)
        .first()
        .text();
      const id = $("figure.clearfix > div.image > a", manga)
        .attr("href")
        ?.split("/")
        .pop();
      const image = $("figure.clearfix > div.image > a > img", manga)
        .first()
        .attr("data-original");
      const subtitle = $(
        "figure.clearfix > figcaption > ul > li.chapter:nth-of-type(1) > a",
        manga,
      )
        .last()
        .text()
        .trim();
      if (!id || !title) continue;
      tiles.push(
        createMangaTile({
          id: id,
          image: !image ? "https://i.imgur.com/GYUxEX8.png" : image,
          title: createIconText({ text: title }),
          subtitleText: createIconText({ text: subtitle }),
        }),
      );
    }
    return tiles;
  }

  parseTags($: any): TagSection[] {
    const arrayTags: Tag[] = [];
    const seenIds = new Set<string>();

    $(".box.genres ul.nav li a").each((_, element) => {
      const $a = $(element);
      const label = $a.text().trim();
      const href = $a.attr("href") || "";

      if (!label || label.toLowerCase() === "tất cả") return;

      // Lấy phần đường dẫn sau domain (ví dụ: tim-truyen/action-95 hoặc tag/truyenqq)
      let id = href.replace(/^https?:\/\/[^\/]+\//, "").trim();
      if (!id) id = label;

      if (seenIds.has(id)) return;
      seenIds.add(id);

      arrayTags.push({ id: id, label: label });
    });

    const tagSections: TagSection[] = [
      createTagSection({
        id: "0",
        label: "Thể Loại",
        tags: arrayTags.map((x) => createTag(x)),
      }),
    ];
    return tagSections;
  }

  parseFeaturedSection($: any): MangaTile[] {
    let featuredItems: MangaTile[] = [];

    for (let manga of $("div.item", "div.altcontent1").toArray()) {
      const title = $(".slide-caption > h3 > a", manga).text();
      const id = $("a", manga).attr("href")?.split("/").pop();
      const image = $("a > img.image-thumb", manga).attr("data-original");
      const subtitle =
        $(".slide-caption > a", manga).text().trim() +
        " - " +
        $(".slide-caption > .time", manga).text().trim();
      if (!id || !title) continue;
      featuredItems.push(
        createMangaTile({
          id: id,
          image: !image ? "https://i.imgur.com/GYUxEX8.png" : image,
          title: createIconText({ text: title }),
          subtitleText: createIconText({
            text: subtitle,
          }),
        }),
      );
    }

    return featuredItems;
  }

  parsePopularSection($: any): MangaTile[] {
    let viewestItems: MangaTile[] = [];

    for (let manga of $("div.item", "div.row").toArray().splice(0, 20)) {
      const title = $("figure.clearfix > figcaption > h3 > a", manga)
        .first()
        .text();
      const id = $("figure.clearfix > div.image > a", manga)
        .attr("href")
        ?.split("/")
        .pop();
      const image = $("figure.clearfix > div.image > a > img", manga)
        .first()
        .attr("data-original");
      const subtitle = $(
        "figure.clearfix > figcaption > ul > li.chapter:nth-of-type(1) > a",
        manga,
      )
        .last()
        .text()
        .trim();
      if (!id || !title) continue;
      viewestItems.push(
        createMangaTile({
          id: id,
          image: !image ? "https://i.imgur.com/GYUxEX8.png" : image,
          title: createIconText({ text: title }),
          subtitleText: createIconText({ text: subtitle }),
        }),
      );
    }

    return viewestItems;
  }

  parseHotSection($: any): MangaTile[] {
    const TopWeek: MangaTile[] = [];
    for (const manga of $("div.item", "div.row").toArray().splice(0, 20)) {
      const title = $("figure.clearfix > figcaption > h3 > a", manga)
        .first()
        .text();
      const id = $("figure.clearfix > div.image > a", manga)
        .attr("href")
        ?.split("/")
        .pop();
      const image = $("figure.clearfix > div.image > a > img", manga)
        .first()
        .attr("data-original");
      const subtitle = $(
        "figure.clearfix > figcaption > ul > li.chapter:nth-of-type(1) > a",
        manga,
      )
        .last()
        .text()
        .trim();
      if (!id || !title) continue;
      TopWeek.push(
        createMangaTile({
          id: id,
          image: !image ? "https://i.imgur.com/GYUxEX8.png" : image,
          title: createIconText({ text: title }),
          subtitleText: createIconText({ text: subtitle }),
        }),
      );
    }

    return TopWeek;
  }

  parseNewUpdatedSection($: any): MangaTile[] {
    let newUpdatedItems: MangaTile[] = [];
    for (let manga of $("div.item", "div.row").toArray().splice(0, 20)) {
      const title = $("figure.clearfix > figcaption > h3 > a", manga)
        .first()
        .text();
      const id = $("figure.clearfix > div.image > a", manga)
        .attr("href")
        ?.split("/")
        .pop();
      const image = $("figure.clearfix > div.image > a > img", manga)
        .first()
        .attr("data-original");
      const subtitle = $(
        "figure.clearfix > figcaption > ul > li.chapter:nth-of-type(1) > a",
        manga,
      )
        .last()
        .text()
        .trim();
      if (!id || !title) continue;
      newUpdatedItems.push(
        createMangaTile({
          id: id,
          image: !image ? "https://i.imgur.com/GYUxEX8.png" : image,
          title: createIconText({ text: title }),
          subtitleText: createIconText({ text: subtitle }),
        }),
      );
    }

    return newUpdatedItems;
  }

  parseNewAddedSection($: any): MangaTile[] {
    let newAddedItems: MangaTile[] = [];
    for (let manga of $("div.item", "div.row").toArray().splice(0, 20)) {
      const title = $("figure.clearfix > figcaption > h3 > a", manga)
        .first()
        .text();
      const id = $("figure.clearfix > div.image > a", manga)
        .attr("href")
        ?.split("/")
        .pop();
      const image = $("figure.clearfix > div.image > a > img", manga)
        .first()
        .attr("data-original");
      const subtitle = $(
        "figure.clearfix > figcaption > ul > li.chapter:nth-of-type(1) > a",
        manga,
      )
        .last()
        .text()
        .trim();
      if (!id || !title) continue;
      newAddedItems.push(
        createMangaTile({
          id: id,
          image: !image ? "https://i.imgur.com/GYUxEX8.png" : image,
          title: createIconText({ text: title }),
          subtitleText: createIconText({ text: subtitle }),
        }),
      );
    }

    return newAddedItems;
  }

  parseFullSection($: any): MangaTile[] {
    let fullItems: MangaTile[] = [];
    for (let manga of $("div.item", "div.row").toArray().splice(0, 20)) {
      const title = $("figure.clearfix > figcaption > h3 > a", manga)
        .first()
        .text();
      const id = $("figure.clearfix > div.image > a", manga)
        .attr("href")
        ?.split("/")
        .pop();
      const image = $("figure.clearfix > div.image > a > img", manga)
        .first()
        .attr("data-original");
      const subtitle = $(
        "figure.clearfix > figcaption > ul > li.chapter:nth-of-type(1) > a",
        manga,
      )
        .last()
        .text()
        .trim();
      if (!id || !title) continue;
      fullItems.push(
        createMangaTile({
          id: id,
          image: !image ? "https://i.imgur.com/GYUxEX8.png" : image,
          title: createIconText({ text: title }),
          subtitleText: createIconText({ text: subtitle }),
        }),
      );
    }

    return fullItems;
  }

  parseViewMoreItems($: any): MangaTile[] {
    const mangas: MangaTile[] = [];
    const collectedIds: string[] = [];
    for (const manga of $("div.item", "div.row")?.toArray()) {
      const title = $("figure.clearfix > figcaption > h3 > a", manga)
        ?.first()
        ?.text();
      const id = $("figure.clearfix > div.image > a", manga)
        ?.attr("href")
        ?.split("/")
        ?.pop();
      const image = $("figure.clearfix > div.image > a > img", manga)
        ?.first()
        ?.attr("data-original");
      const subtitle = $(
        "figure.clearfix > figcaption > ul > li.chapter:nth-of-type(1) > a",
        manga,
      )
        ?.last()
        ?.text()
        ?.trim();
      if (!id || !title) continue;
      if (!collectedIds?.includes(id)) {
        //ko push truyện trùng nhau
        mangas?.push(
          createMangaTile({
            id: id,
            image: !image ? "https://i.imgur.com/GYUxEX8.png" : image,
            title: createIconText({ text: title || "" }),
            subtitleText: createIconText({ text: subtitle || "" }),
          }),
        );
        collectedIds?.push(id);
      }
    }
    return mangas;
  }

  parseUpdatedManga(updateManga: any, time: Date, ids: string[]): MangaUpdates {
    const returnObject: MangaUpdates = {
      ids: [],
    };
    // // for (let manga of $('div.item', 'div.row').toArray()) {
    // const id = ids[0];
    // let x = $('time.small').text().trim();
    // let y = x.split("lúc:")[1].replace(']', '').trim().split(' ');
    // let z = y[1].split('/');
    // const timeUpdate = new Date(z[1] + '/' + z[0] + '/' + z[2] + ' ' + y[0]);
    // updateManga.push(({
    //     id: id,
    //     time: timeUpdate
    // }));
    // // }

    for (const elem of updateManga) {
      if (ids.includes(elem.id) && time < this.convertTime(elem.time))
        returnObject.ids.push(elem.id);
    }
    return returnObject;
  }

  parseIsLastPage($: any): boolean {
    const current = $("ul.pagination > li.active > span.page-link").text();
    let total = $("ul.pagination > li:nth-last-child(2) > a.page-link").text();

    // if (current) {
    //   total = total ?? "";
    //   return +total === +current; //+ => convert value to number
    // }
    // return true;

    return false;
  }
}

export const decodeHTMLEntity = (str: string): string => {
  return entities.decodeHTML(str);
};
