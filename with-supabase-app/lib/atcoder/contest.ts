import * as cheerio from 'cheerio';
import { fetchUpcomingContests, fetchRecentContests } from '@qatadaazzeh/atcoder-api';

export async function getUpcomingcontests() {
    try {
        return await fetchUpcomingContests();
    } catch (e) {
        // e를 사용하여 에러 내용을 포함하거나, 사용하지 않을 거라면 catch (_) 로 변경
        return `에러: 예정된 컨테스트 정보를 가져오는 중 오류가 발생했습니다. (${e instanceof Error ? e.message : 'Unknown'})`;
    }
}

export async function getRecentContests() {
    try {
        return await fetchRecentContests();
    } catch (e) {
        return `에러: 최근 컨테스트 정보를 가져오는 중 오류가 발생했습니다. (${e instanceof Error ? e.message : 'Unknown'})`;
    }
}

export async function getTaskLinkList(contestUrl: string) {
    try {
        const response = await fetch(`${contestUrl}/tasks`);
        if (!response.ok) {
            return `에러: 태스크를 가져오는 데 실패했습니다. (HTTP ${response.status})`;
        }
        const html = await response.text();
        const $ = cheerio.load(html);
        const taskElements = $('table.table-bordered.table-striped tbody').find('tr');
        
        if (taskElements.length === 0) {
            return "에러: 해당 페이지에서 태스크 요소를 찾을 수 없습니다.";
        }

        const linkList: string[] = [];
        for(let i=0; i<taskElements.length; i++) {
            const href = $(taskElements[i]).find('td').find('a').attr('href');
            if (href) {
                linkList.push(`https://atcoder.jp${href}`);
            }
        }
        return linkList;
    } catch (e) {
        return `오류: getTaskLinkList 실행 중 예외 발생: ${e instanceof Error ? e.message : 'Unknown'}`;
    }
}

export async function getTaskMetadata(taskUrl: string) {
    try {
        const response = await fetch(taskUrl);
        if (!response.ok) {
            return `에러: 태스크 메타데이터를 가져오지 못했습니다. (HTTP ${response.status})`;
        }
        const html = await response.text();
        const $ = cheerio.load(html);

        const title = $('span.h2').contents().first().text().trim();
        const langEn = $('#task-statement > span > span.lang-en');
        
        const problem_statement = langEn.find('div:nth-child(2) > section').html();
        const constraint = langEn.find('div:nth-child(3) > section').html();
        const input = langEn.find('div.io-style > div:nth-child(1) > section').html();
        const output = langEn.find('div.io-style > div:nth-child(2) > section').html();
        
        const samples = [];
        for(let i=7; ; i+=3) {
            const sample_input = langEn.find(`div:nth-child(${i}) > section`).html();
            const sample_output = langEn.find(`div:nth-child(${i+1}) > section`).html();
            if(!sample_input || !sample_output) break;
            samples.push({ input: sample_input, output: sample_output });
        }

        if (!title || !problem_statement) {
            return '에러: 태스크 메타데이터 파싱에 실패했습니다. (셀렉터 불일치)';
        }

        return { title, problem_statement, constraint, input, output, samples, task_url: taskUrl };
    } catch (e) {
        return `오류: getTaskMetadata 실행 중 예외 발생: ${e instanceof Error ? e.message : 'Unknown'}`;
    }
}

function getContestUrlFromTaskUrl(taskUrl: string) {
    return taskUrl.split('/tasks/')[0];
}

function getTaskIndexFromUrl(taskUrl: string) {
    const parts = taskUrl.split('_');
    const last = parts.pop();
    if (!last) return 0;
    return last.charCodeAt(0) - 'a'.charCodeAt(0);
}

export async function getEditorial(taskUrl: string) {
    try {
        const contestUrl = getContestUrlFromTaskUrl(taskUrl);
        const response = await fetch(`${contestUrl}/editorial`);
        if (!response.ok) {
            return `에러: 에디토리얼 목록 로드 실패 (HTTP ${response.status})`;
        }
        const html = await response.text();
        const $ = cheerio.load(html);
        const taskIndex = getTaskIndexFromUrl(taskUrl);
        
        const selector = `#main-container > div.row > div:nth-child(2) > ul:nth-child(${7+3*taskIndex}) > li > a:nth-child(2)`;
        const href = $(selector).attr('href');
        
        if (!href) {
            return "에러: 해당 문제의 에디토리얼 링크를 찾을 수 없습니다.";
        }

        const editorialUrl = `https://atcoder.jp${href}`;
        const editorialResponse = await fetch(editorialUrl);
        if (!editorialResponse.ok) {
            return `에러: 에디토리얼 본문 로드 실패 (HTTP ${editorialResponse.status})`;
        }
        const editorialHtml = await editorialResponse.text();
        const $$ = cheerio.load(editorialHtml);
        const editorialStatement = $$('#main-container > div.row > div:nth-child(2) > div:nth-child(4)').html();
        
        if (!editorialStatement) {
            return "에러: 에디토리얼 본문을 파싱할 수 없습니다.";
        }

        return editorialStatement;
    } catch (e) {
        return `오류: getEditorial 실행 중 예외 발생: ${e instanceof Error ? e.message : 'Unknown'}`;
    }
}