/**
 * protocol-check.js — deliberately a CLASSIC script, not a module.
 *
 * ES modules are blocked by the browser over file://, so a page opened by
 * double clicking it would silently render nothing. Classic scripts still run,
 * so this one detects that case and explains the fix instead.
 */
(function () {
  'use strict';
  if (location.protocol !== 'file:') return;

  document.addEventListener('DOMContentLoaded', function () {
    var shell = document.querySelector('.shell') || document.querySelector('.doc');
    if (shell) shell.style.display = 'none';

    var box = document.getElementById('fileProtocolWarning');
    if (!box) {
      box = document.createElement('div');
      box.id = 'fileProtocolWarning';
      document.body.appendChild(box);
    }
    box.innerHTML =
      '<h2>Start a local server first</h2>' +
      '<p>This page is open straight off the disk. Browsers block JavaScript modules ' +
      'over <code>file://</code>, so the game cannot load.</p>' +
      '<p>Open a terminal in the project folder and run one of these, then visit ' +
      '<code>http://localhost:8000</code>:</p>' +
      '<pre>python -m http.server 8000\n\nnpx serve .</pre>' +
      '<p>On Windows you can just double click <code>serve.bat</code> in this folder.</p>' +
      '<p>Once the site is on GitHub Pages or any other host, none of this applies ' +
      'and the link simply works.</p>';
    box.style.display = 'block';
  });
})();
