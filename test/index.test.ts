// @ts-nocheck
import { resolve } from 'path'
import chalk from 'chalk'
import { listen } from '../src'

chalk.level = 0

jest.mock('clipboardy')
const clipboardy = require('clipboardy')
clipboardy.write = jest.fn().mockImplementation(() => Promise.resolve())

jest.mock('open')
const open = require('open')
open.mockImplementation(() => Promise.resolve())

// eslint-disable-next-line no-console
console.log = jest.fn()

function handle (req, res) {
  res.end(req.url)
}

describe('listhen', () => {
  let listener

  afterEach(async () => {
    if (listener) {
      await listener.close()
      listener = null
    }
  })

  test('listen (no args)', async () => {
    listener = await listen(handle)
    expect(listener.url.startsWith('http://')).toBe(true)
  })

  test('listen (http)', async () => {
    listener = await listen(handle, {
      isTest: false,
      autoClose: false,
      clipboard: true,
      open: true,
      baseURL: '/foo/bar'
    })
    expect(listener.url.startsWith('http://')).toBe(true)
    expect(listener.url.endsWith('/foo/bar')).toBe(true)
    // eslint-disable-next-line no-console
    expect(console.log).toHaveBeenCalledWith(`> server listening on ${listener.url}`, '(copied to clipboard)')
  })

  test('getURL', async () => {
    const { getURL } = await listen(handle, { baseURL: '/foo/' })
    expect(getURL('/bar/baz')).toMatch('/foo/bar/baz')
  })

  test('listen (https - selfsigned)', async () => {
    listener = await listen(handle, { https: true })
    expect(listener.url.startsWith('https://')).toBe(true)
  })

  test('listen (https - custom)', async () => {
    listener = await listen(handle, {
      https: true,
      certificate: {
        key: resolve(__dirname, 'fixture/cert/key.pem'),
        cert: resolve(__dirname, 'fixture/cert/cert.pem')
      }
    })
    expect(listener.url.startsWith('https://')).toBe(true)
  })

  test('silent errors', async () => {
    clipboardy.write.mockImplementationOnce(() => Promise.reject(new Error('Error')))
    open.mockImplementationOnce(() => Promise.reject(new Error('Error')))
    listener = await listen(handle, { isTest: false, clipboard: true, open: true })
  })

  test('double close', async () => {
    listener = await listen(handle, { isTest: false, clipboard: true, open: true })
    await listener.close()
    await listener.close()
  })

  test('$fetch', async () => {
    const { $fetch } = await listen(handle, { baseURL: '/foo/' })
    expect(await $fetch('/bar/baz', { params: { foo: 123 } })).toBe('/foo/bar/baz?foo=123')
  })

  test('autoClose', async () => {
    /* not passing close */ await listen(handle)
    process.emit('exit')
  })
})
