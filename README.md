# @selfage/screenshot_test_matcher

## Install
`npm install @selfage/screenshot_test_matcher`

## Overview
Written in TypeScript and compiled to ES6 with inline source map & source. See [@selfage/tsconfig](https://www.npmjs.com/package/@selfage/tsconfig) for full compiler options. Provides assertion on screenshots while generating/deleting diff files directly in browser context. It needs to be executed by [@selfage/puppeteer_test_executor](https://github.com/selfage/puppeteer_test_executor) or [@selfage/bundler_cli](https://github.com/selfage/bundler_cli), which leverages [Puppeteer](https://github.com/puppeteer/puppeteer) to launch a browser page.

## Basic usage

```TypeScript
import { asyncAssertScreenshot } from '@selfage/screenshot_test_matcher';

async function main(): Promise<void> {
  // Append some img to body.
  document.body.style.margin = "0";
  document.body.style.padding = "0";
  let img = document.createElement("img");
  let loaded = new Promise<void>((resolve) => {
    img.onload = () => {
      resolve();
    };
  });
  img.src = ...
  await loaded;
  document.body.appendChild(img);

  // Assert screenshot
  await asyncAssertScreenshot(
    'actual/file/path.png',
    'expected/file/path.png',
    'diff/file/path.png'
  );
}
```

The actual screenshot will be written to the `actual/file/path.png`. It will be deleted, if assertion succeeded. Otherwise, a diff file will also be written to `diff/file/path.png`. The file path is a relative path whose base path is provided when executed by [@selfage/puppeteer_test_executor](https://github.com/selfage/puppeteer_test_executor) or [@selfage/bundler_cli](https://github.com/selfage/bundler_cli).

## Advanced options

```TypeScript
  await asyncAssertScreenshot(
    'actual/file/path.png',
    'expected/file/path.png',
    'diff/file/path.png',
    {
      // Default to 500ms. to wait for page to be stable before taking screenshot.
      delay: 500,
      // Default to false. Whether to take screenshot for the full page.
      fullPage: true,
      // The quality of the image, between 0-100. Not applicable to png images.
      quality: 80,
      // Default to 0.1. Range from 0 to 1. Smaller values make the comparison more sensitive.
      threshold: .1;
      // A list of rectangle areas to be excluded from comparison.
      excludedAreas: [{
        x: 10,
        y: 20,
        width: 100,
        height: 200
      }]
    }
  );
```
