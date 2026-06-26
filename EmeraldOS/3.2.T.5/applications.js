"use strict";

/* =========================================================
   TESTOS APPLICATIONS COMPATIBILITY MODULE
========================================================= */

/*
   TestOS 3.2.T.5 keeps the complete application registry,
   edition permissions, and app renderers inside os.js.

   This file is intentionally safe to load, but OS.html does
   not require it. It exists so old references to applications.js
   do not reintroduce duplicate function declarations such as
   renderSystemPanel.
*/

export {};
