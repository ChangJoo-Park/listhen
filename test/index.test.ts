// @ts-nocheck
import chalk from 'chalk'
import { listen } from '../src'

chalk.level = 0

function handle (_req, res) {
  res.end('works')
}

console.log = jest.fn()

describe('listhen', () => {
  let listener

  afterEach(async () => {
    if (listener) {
      await listener.close()
    }
  })

  test('listen', async () => {
    listener = await listen(handle)
    expect(listener.url.startsWith('http://')).toBe(true)
    expect(console.log).toHaveBeenCalledWith(`> server listening on ${listener.url}`)
  })
})