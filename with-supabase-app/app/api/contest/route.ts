
import * as cheerio from 'cheerio';
import { fetchUpcomingContests, fetchRecentContests } from '@qatadaazzeh/atcoder-api';
// import { TaskInfo } from '@/types/atcoder';

// Get upcoming contests
const upcoming = await fetchUpcomingContests();
console.log('Found '+ upcoming.length +' upcoming contests');

// Get recent contests
const recent = await fetchRecentContests();
// console.log(recent);
console.log('Found ' + recent.length + ' recent contests');

export async function getTaskLinkList(contestUrl: string) {
    const response = await fetch(`${contestUrl}/tasks`);
    if (!response.ok) {
        throw new Error('Faile to fetch tasks. check url again.')
    }
    const html = await response.text();
    const $ = cheerio.load(html);
    const taskElements = $('table.table-bordered.table-striped tbody').find('tr');
    console.log(taskElements.length);
    const linkList: string[] = [];
    for(let i=0; i<taskElements.length; i++) {
        linkList.push(`https://atcoder.jp${$(taskElements[i]).find('td').find('a').attr('href')!}`)
    }
    return linkList;
}

export async function getTaskMetadata(taskUrl: string)/*: Promise<TaskInfo>*/{
    /*
     task info를 가져오는 함수
    */
    const response = await fetch(taskUrl);
    if (!response.ok) {
        throw new Error('Failed to fetch task metadata.');
    }
    const html = await response.text();
    const $ = cheerio.load(html);

    const title = $('span.h2').contents().first().text().trim();
    const problem_statement = $('#task-statement > span > span.lang-en > div:nth-child(2) > section').html();
    const constraint = $('#task-statement > span > span.lang-en > div:nth-child(3) > section').html();
    const input = $('#task-statement > span > span.lang-en > div.io-style > div:nth-child(1) > section').html();
    const output = $('#task-statement > span > span.lang-en > div.io-style > div:nth-child(2) > section').html();
    const samples = [];

    for(let i=7; ; i+=3) {
        const sample_input = $(`#task-statement > span > span.lang-en > div:nth-child(${i}) > section`).html();
        const sample_output = $(`#task-statement > span > span.lang-en > div:nth-child(${i+1}) > section`).html();
        if(!sample_input || !sample_output) break;
        samples.push({
            input: sample_input,
            output: sample_output
        });
    }
    console.log(title, problem_statement, constraint, input, output, samples)
    if (!title || !problem_statement || !constraint || !input || !output) {
        throw new Error('Failed to parse task metadata.');
    }

    return { title, problem_statement, constraint, input, output, samples, task_url: taskUrl};
}

function getContestUrlFromTaskUrl(taskUrl: string) {
    return taskUrl.split('/tasks/')[0];
}
function getTaskIndexFromUrl(taskUrl: string) {
    const last = taskUrl.split('_').pop();
    if (!last) {
        throw new Error('Invalid task URL format.');
    }
    return last.charCodeAt(0) - 'a'.charCodeAt(0);
}

export async function getEditorial(taskUrl: string) {
    const contestUrl = getContestUrlFromTaskUrl(taskUrl);

    const response = await fetch(`${contestUrl}/editorial`);
    if (!response.ok) {
        throw new Error('Failed to fetch task metadata.');
    }
    const html = await response.text();
    const $ = cheerio.load(html);
    const taskIndex = getTaskIndexFromUrl(taskUrl);
    console.log('Task index:', taskIndex);  
    const selector = `#main-container > div.row > div:nth-child(2) > ul:nth-child(${7+3*taskIndex}) > li > a:nth-child(2)`;
    const editorialUrl = `https://atcoder.jp${$(selector).attr('href')}`;
    const editorialResponse = await fetch(editorialUrl);
    if (!editorialResponse.ok) {
        throw new Error('Failed to fetch editorial page.');
    }
    const editorialHtml = await editorialResponse.text();
    const $$ = cheerio.load(editorialHtml);
    const editorialStatement = $$('#main-container > div.row > div:nth-child(2) > div:nth-child(4)').html();
    console.log(editorialUrl);
    console.log(editorialStatement)
    return editorialStatement;
}   


// await getEditorial('https://atcoder.jp/contests/agc075/tasks/agc075_a');

// getTaskLinkList(recent[0].contestUrl).then(linkList => {
//         getTaskMetadata(linkList[0]).then(metadata => {
//         console.log(metadata);
//         return metadata;
//     })
// }).catch(err => {throw new Error(err);});