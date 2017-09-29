import test from 'ava';
import got from 'got';
import micro from 'micro';
import nock from 'nock';
import testListen from 'test-listen';
import delay from 'delay';
import fixture from './example-response';

const ORIGIN = process.env.ACCESS_ALLOW_ORIGIN;
const TOKEN = process.env.GITHUB_TOKEN;
const USERNAME = process.env.GITHUB_USERNAME;
const REPOS = process.env.REPOS_COUNT;

let url;

test.before(async () => {
	process.env.ACCESS_ALLOW_ORIGIN = '*';
	process.env.GITHUB_TOKEN = 'unicorn';
	process.env.GITHUB_USERNAME = 'sindresorhus';
	process.env.REPOS_COUNT = 10;

	const response = {
		data: {
			user: {
				repositories: {
					nodes: fixture
				}
			}
		}
	};

	nock('https://api.github.com/graphql')
		.filteringPath(pth => `${pth}/`)
		.matchHeader('authorization', `bearer ${process.env.GITHUB_TOKEN}`)
		.post('/')
		.reply(200, response);

	url = await testListen(micro(require('.')));

	await delay(1000);
});

test.after(() => {
	process.env.ACCESS_ALLOW_ORIGIN = ORIGIN;
	process.env.GITHUB_TOKEN = TOKEN;
	process.env.GITHUB_USERNAME = USERNAME;
	process.env.REPOS_COUNT = REPOS;
});

test('fetch latest repos for user', async t => {
	console.log('URL', url);
	const {body} = await got(url, {json: true});
	console.log('body', body);
	t.deepEqual(body, fixture);
});

test('set origin header', async t => {
	const {headers} = await got(url, {json: true});
	t.is(headers['access-control-allow-origin'], '*');
});
