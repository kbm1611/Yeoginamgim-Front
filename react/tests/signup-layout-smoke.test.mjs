import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const signupCss = readFileSync(join(root, 'src/css/signup.css'), 'utf8')

const getRuleBody = (selector) => {
  const rule = new RegExp(`${selector.replace('.', '\\.')}\\s*\\{([\\s\\S]*?)\\}`).exec(signupCss)
  assert.ok(rule, `${selector} rule should exist`)
  return rule[1]
}

test('signup page can scroll inside the fixed app device viewport', () => {
  const signupPageRule = getRuleBody('.signup-page')

  assert.match(signupPageRule, /overflow-y:\s*auto/)
  assert.match(signupPageRule, /min-height:\s*100%/)
})

test('signup submit remains reachable without covering the last fields', () => {
  const signupFormRule = getRuleBody('.signup-form')
  const signupSubmitRule = getRuleBody('.signup-submit')

  assert.doesNotMatch(signupFormRule, /padding-bottom:\s*calc\(/)
  assert.doesNotMatch(signupSubmitRule, /position:\s*(sticky|fixed)/)
  assert.doesNotMatch(signupSubmitRule, /bottom:\s*calc\(/)
  assert.match(signupSubmitRule, /width:\s*100%/)
})

test('profile image file input is hidden behind a styled selector', () => {
  const fileInputRule = getRuleBody('.signup-file-input')
  const fileSelectorRule = getRuleBody('.signup-file-selector')

  assert.match(fileInputRule, /position:\s*absolute/)
  assert.match(fileInputRule, /opacity:\s*0/)
  assert.match(fileSelectorRule, /border:\s*1px solid #e7d9cc/)
  assert.match(fileSelectorRule, /background:\s*#fffcf8/)
})
