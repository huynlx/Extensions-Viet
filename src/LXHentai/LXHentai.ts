import {
  Source,
  Manga,
  Chapter,
  ChapterDetails,
  HomeSection,
  SearchRequest,
  PagedResults,
  SourceInfo,
  TagType,
  TagSection,
  ContentRating,
  RequestHeaders,
  MangaTile,
  Tag,
  LanguageCode,
  HomeSectionType,
  Request,
  Response,
} from "paperback-extensions-common";

import { parseSearch, isLastPage, parseViewMore } from "./LXHentaiParser";

const DOMAIN = "https://lxmanga.click/";
const method = "GET";

export const LXHentaiInfo: SourceInfo = {
  version: "2.0.2",
  name: "LXHentai",
  icon: "icon.png",
  author: "Huynhzip3",
  authorWebsite: "https://github.com/huynh12345678",
  description: "Extension that pulls manga from LXHentai",
  websiteBaseURL: DOMAIN,
  contentRating: ContentRating.ADULT,
  sourceTags: [
    {
      text: "18+",
      type: TagType.YELLOW,
    },
  ],
};

export class LXHentai extends Source {
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

  getMangaShareUrl(mangaId: string): string {
    return `${mangaId}`;
  }
  requestManager = createRequestManager({
    requestsPerSecond: 5,
    requestTimeout: 20000,
    interceptor: {
      interceptRequest: async (request: Request): Promise<Request> => {
        request.headers = {
          ...(request.headers ?? {}),
          ...{
            referer: DOMAIN,
          },
        };

        return request;
      },

      interceptResponse: async (response: Response): Promise<Response> => {
        return response;
      },
    },
  });

  async getMangaDetails(mangaId: string): Promise<Manga> {
    const request = createRequestObject({
      url: `${mangaId}`,
      method: "GET",
    });
    const data = await this.requestManager.schedule(request, 10);
    let $ = this.cheerio.load(data.data);
    let tags: Tag[] = [];
    let creator = "";
    let status = 1; //completed, 1 = Ongoing
    let artist = "";
    let desc = $(".py-4.border-t.border-gray-200 > p:nth-last-child(2)").text();

    creator = $("span:contains('Tác giả:')").next().text();
    status = $("span:contains('Tình trạng:')")
      .next()
      .text()
      .toLowerCase()
      .includes("đã")
      ? 0
      : 1;
    for (const t of $("a", $("span:contains('Thể loại:')").next()).toArray()) {
      const genre = $(t).text().trim();
      const id = $(t).attr("href") ?? genre;
      tags.push(createTag({ label: genre, id }));
    }

    artist = $("span:contains('Thực hiện:')").next().text();

    const image = $("div.cover-frame > .cover").css("background-image");
    const bg = image
      ?.replace("url(", "")
      .replace(")", "")
      .replace(/\"/gi, "")
      .replace(/['"]+/g, "");

    return createManga({
      id: mangaId,
      author: creator,
      artist: artist,
      desc: desc,
      titles: [
        $(".grow.text-lg.ml-1.text-ellipsis.font-semibold").first().text(),
      ],
      image: bg || "",
      status: status,
      // rating: parseFloat($('span[itemprop="ratingValue"]').text()),
      hentai: true,
      tags: [createTagSection({ label: "genres", tags: tags, id: "0" })],
    });
  }
  async getChapters(mangaId: string): Promise<Chapter[]> {
    const request = createRequestObject({
      url: mangaId,
      method,
    });
    const response = await this.requestManager.schedule(request, 1);
    const $ = this.cheerio.load(response.data);
    const chapters: Chapter[] = [];
    var i = 0;
    for (const obj of $("ul.overflow-y-auto.overflow-x-hidden > a")
      .toArray()
      .reverse()) {
      i++;
      let time = $(".hidden > span.timeago", obj).attr("datetime");
      let view = $(".hidden > span", obj).first().text();
      let number = $(".text-ellipsis", obj).text().split(" ")[1];

      chapters.push(
        createChapter(<Chapter>{
          id: "https://lxmanga.click" + $(obj).attr("href"),
          chapNum: parseFloat(number) || i,
          name: parseFloat(number) ? "" : number,
          mangaId: mangaId,
          langCode: LanguageCode.VIETNAMESE,
          time: new Date(time),
          group: view + " lượt xem",
        })
      );
    }

    return chapters;
  }

  async getChapterDetails(
    mangaId: string,
    chapterId: string
  ): Promise<ChapterDetails> {
    const request = createRequestObject({
      url: chapterId,
      method,
    });

    const response = await this.requestManager.schedule(request, 1);
    let $ = this.cheerio.load(response.data);
    const pages: string[] = [];
    const list = $(".text-center > #image-container").toArray();
    for (let obj of list) {
      let link = $(obj).attr("data-src");
      pages.push(encodeURI(link));
    }

    const chapterDetails = createChapterDetails({
      id: chapterId,
      mangaId: mangaId,
      pages: pages,
      longStrip: false,
    });
    return chapterDetails;
  }

  async getHomePageSections(
    sectionCallback: (section: HomeSection) => void
  ): Promise<void> {
    let featured: HomeSection = createHomeSection({
      id: "featured",
      title: "Truyện Đề Cử",
      type: HomeSectionType.featured,
    });
    let mostViewed: HomeSection = createHomeSection({
      id: "most_viewed",
      title: "Xem nhiều nhất",
      view_more: true,
    });
    let newUpdated: HomeSection = createHomeSection({
      id: "new_updated",
      title: "Mới cập nhật",
      view_more: true,
    });
    let hot: HomeSection = createHomeSection({
      id: "hot",
      title: "Hot nhất",
      view_more: false,
    });

    sectionCallback(newUpdated);
    sectionCallback(hot);
    sectionCallback(mostViewed);
    sectionCallback(featured);

    //New Updates
    let request = createRequestObject({
      url: "https://lxmanga.click/tim-kiem?sort=-updated_at&filter[status]=2,1&page=1",
      method: "GET",
    });
    let newUpdatedItems: MangaTile[] = [];
    let data = await this.requestManager.schedule(request, 1);
    let $ = this.cheerio.load(data.data);
    // let html = Buffer.from(createByteArray(data.rawData)).toString();
    // let $ = this.cheerio.load(html);
    for (let manga of $("div.manga-vertical", ".grid")
      .toArray()
      .splice(0, 15)) {
      const title = $("div.p-2.w-full.truncate > a.text-ellipsis", manga)
        .text()
        .trim();
      const id =
        $("div.p-2.w-full.truncate > a.text-ellipsis", manga).attr("href") ??
        title;

      const image = $("div.cover-frame > div.cover", manga).css(
        "background-image"
      );
      const bg = image
        ?.replace("url(", "")
        .replace(")", "")
        .replace(/\"/gi, "")
        .replace(/['"]+/g, "");
      const sub = $("div.latest-chapter > a", manga).first().text().trim();

      newUpdatedItems.push(
        createMangaTile({
          id: "https://lxmanga.click" + id,
          image: bg,
          title: createIconText({
            text: title,
          }),
          subtitleText: createIconText({
            text: sub,
          }),
        })
      );
    }
    newUpdated.items = newUpdatedItems;
    sectionCallback(newUpdated);

    //Hot
    request = createRequestObject({
      url: "https://lxmanga.click",
      method: "GET",
    });
    let hotItems: MangaTile[] = [];
    data = await this.requestManager.schedule(request, 1);
    // html = Buffer.from(createByteArray(data.rawData)).toString();
    $ = this.cheerio.load(data.data);
    for (let manga of $("div.manga-vertical", "ul.glide__slides").toArray()) {
      const title = $("div.p-2.w-full.truncate > a.text-ellipsis", manga)
        .text()
        .trim();
      const id =
        $("div.p-2.w-full.truncate > a.text-ellipsis", manga).attr("href") ??
        title;

      const image = $("div.cover-frame > div.cover", manga).css(
        "background-image"
      );
      const bg = image
        ?.replace("url(", "")
        .replace(")", "")
        .replace(/\"/gi, "")
        .replace(/['"]+/g, "");
      const sub = $("div.latest-chapter > a", manga).first().text().trim();
      hotItems.push(
        createMangaTile({
          id: "https://lxmanga.click" + id,
          image: bg,
          title: createIconText({
            text: title,
          }),
          subtitleText: createIconText({
            text: sub,
          }),
        })
      );
    }
    hot.items = hotItems;
    sectionCallback(hot);

    //Most Viewed
    request = createRequestObject({
      url: "https://lxmanga.click/tim-kiem?sort=-views&filter[status]=2,1&page=1",
      method: "GET",
    });
    let mostViewedItems: MangaTile[] = [];
    data = await this.requestManager.schedule(request, 1);
    // html = Buffer.from(createByteArray(data.rawData)).toString();
    $ = this.cheerio.load(data.data);
    for (let manga of $("div.manga-vertical", ".grid")
      .toArray()
      .splice(0, 15)) {
      const title = $("div.p-2.w-full.truncate > a.text-ellipsis", manga)
        .text()
        .trim();
      const id =
        $("div.p-2.w-full.truncate > a.text-ellipsis", manga).attr("href") ??
        title;

      const image = $("div.cover-frame > div.cover", manga).css(
        "background-image"
      );
      const bg = image
        ?.replace("url(", "")
        .replace(")", "")
        .replace(/\"/gi, "")
        .replace(/['"]+/g, "");
      const sub = $("div.latest-chapter > a", manga).first().text().trim();
      mostViewedItems.push(
        createMangaTile({
          id: "https://lxmanga.click" + id,
          image: bg,
          title: createIconText({
            text: title,
          }),
          subtitleText: createIconText({
            text: sub,
          }),
        })
      );
    }
    mostViewed.items = mostViewedItems;
    sectionCallback(mostViewed);

    //Có thể bạn muốn đọc
    request = createRequestObject({
      url: "https://lxmanga.click/",
      method: "GET",
    });
    let featuredItems: MangaTile[] = [];
    data = await this.requestManager.schedule(request, 1);
    // html = Buffer.from(createByteArray(data.rawData)).toString();
    $ = this.cheerio.load(data.data);
    for (let manga of $("div.manga-vertical", ".mt-4.grid.gap-3").toArray()) {
      const title = $("div.p-2.w-full.truncate > a.text-ellipsis", manga)
        .text()
        .trim();
      const id =
        $("div.p-2.w-full.truncate > a.text-ellipsis", manga).attr("href") ??
        title;

      const image = $("div.cover-frame > div.cover", manga).css(
        "background-image"
      );
      const bg = image
        ?.replace("url(", "")
        .replace(")", "")
        .replace(/\"/gi, "")
        .replace(/['"]+/g, "");
      const sub = $("div.latest-chapter > a", manga).first().text().trim();
      featuredItems.push(
        createMangaTile({
          id: "https://lxmanga.click" + id,
          image: bg,
          title: createIconText({
            text: title,
          }),
          subtitleText: createIconText({
            text: sub,
          }),
        })
      );
    }
    featured.items = featuredItems;
    sectionCallback(featured);
  }

  async getViewMoreItems(
    homepageSectionId: string,
    metadata: any
  ): Promise<PagedResults> {
    let page: number = metadata?.page ?? 1;
    let param = "";
    let url = "";
    switch (homepageSectionId) {
      case "new_updated":
        url = `https://lxmanga.click/tim-kiem?sort=-updated_at&filter[status]=2,1&page=${page}`;
        break;
      case "most_viewed":
        url = `https://lxmanga.click/tim-kiem?sort=-views&filter[status]=2,1&page=${page}`;
        break;
      default:
        return Promise.resolve(createPagedResults({ results: [] }));
    }

    const request = createRequestObject({
      url,
      method,
      param,
    });

    let data = await this.requestManager.schedule(request, 1);
    // let html = Buffer.from(createByteArray(data.rawData)).toString();
    let $ = this.cheerio.load(data.data);

    const manga = parseViewMore($);
    metadata = !isLastPage($) ? { page: page + 1 } : undefined;
    return createPagedResults({
      results: manga,
      metadata,
    });
  }

  async getSearchResults(
    query: SearchRequest,
    metadata: any
  ): Promise<PagedResults> {
    let page = metadata?.page ?? 1;
    const tags = query.includedTags?.map((tag) => tag.label) ?? [];
    const request = createRequestObject({
      url: query.title
        ? `${DOMAIN}tim-kiem?sort=-updated_at&filter[name]=${encodeURI(
            query.title
          )}&filter[status]=2,1&page=${page}`
        : `${DOMAIN}the-loai/${tags[0]}?page=${page}`,
      method: "GET",
    });

    const data = await this.requestManager.schedule(request, 1);
    // const html = Buffer.from(createByteArray(data.rawData)).toString();
    let $ = this.cheerio.load(data.data);
    const tiles = parseSearch($, query);

    metadata = !isLastPage($) ? { page: page + 1 } : undefined;

    return createPagedResults({
      results: tiles,
      metadata,
    });
  }

  async getSearchTags(): Promise<TagSection[]> {
    const url = `https://lxmanga.click`;
    const request = createRequestObject({
      url: url,
      method: "GET",
    });

    const response = await this.requestManager.schedule(request, 1);
    // const html = Buffer.from(createByteArray(response.rawData)).toString();
    const $ = this.cheerio.load(response.data);
    const arrayTags: Tag[] = [];
    //the loai
    for (const tag of $("a", ".absolute.w-full.text-black").toArray()) {
      const label = $(tag).text().trim();
      const id = "https://lxmanga.click" + $(tag).attr("href") ?? label;
      if (!id || !label) continue;
      arrayTags.push({ id: id, label: label });
    }

    const tagSections: TagSection[] = [
      createTagSection({
        id: "0",
        label: "Thể Loại",
        tags: arrayTags.map((x) => createTag(x)),
      }),
    ];
    return tagSections;
  }
}
