import cheerio from 'react-native-cheerio';
import Base, { Data } from './base';

class Vidstreaming extends Base {

    data: Data = {
        version: "1.0.0",
        developer: "Michael24884",
        name: "Vidstreaming",
        baseURL: "https://vidstreaming.io"
    };

    async notificationTasks(link: string): Promise<number> {
        return (await this.returnAvailableEpisodes(link)).length;
    }

    async returnScrapedTitles(title: string): Promise<import("./base").GlobalAnimeLink[]> {
        const data = await this.instance.get('/search.html', {
            params: {
                'keyword': title
            }
        });
        const $ = cheerio.load(data.data);
        return $('li.video-block')
            .toArray()
            .map((e: Element) => {

                const title = $(e)
                    .find('div[class="picture"]')
                    .find('img[src]')
                    .attr('alt')


                const link = `https://vidstreaming.io${$(e)
                    .find('a')
                    .attr('href')
                    }`

                const image = $(e)
                    .find('div.picture')
                    .find('img')
                    .attr('src')

                return { title, image, link };
            });
    }
    async returnAvailableEpisodes(link: string): Promise<string[]> {

        const request = await this.instance.get(link)
        const $ = cheerio.load(request.data)
        return $('ul.listing.items.lists > li.video-block')
            .toArray()
            .map((element: Element, _index: number) => {
                const epLink = $(element).find('a').attr('href');
                return (`https://vidstreaming.io${epLink}`);
            }).reverse();
    }


    _grabEpisodeData = async (episodeLink: string): Promise<string> => {
        const pageData = await this.instance.get(episodeLink);
        const $ = cheerio.load(pageData.data)

        const phpFile = $('div.watch_play')
            .find('div.play-video')
            .find('iframe')
            .attr('src')
        return `https:${phpFile}`; //'https:$phpFile';
    }

    async availableServers(episodeLink: string): Promise<import("./base").ServerItems[]> {
        const _directPage = await this._grabEpisodeData(episodeLink)
        const pageData = await this.instance.get(_directPage)


        const $ = cheerio.load(pageData.data)

        return $('ul.list-server-items')
            .find('li.linkserver')
            .toArray()
            .map((element: Element) => {
                if ($(element).attr('data-status') == '1') {
                    const _mint = $(element).text().trim()
                    if (_mint === 'Server Hyrax') return
                    if (_mint === "Easyload") return
                    const hostName = $(element).text().trim()
                    let _hostLink: string = $(element).attr('data-video')
                    if (_hostLink.startsWith('/')) _hostLink = 'https:' + _hostLink
                    return ({ server: hostName, link: _hostLink });


                }
            });
    }


}

export default Vidstreaming;