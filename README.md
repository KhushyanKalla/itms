ITMS — Internship & Training Management System

Overview

ITMS is a role-based web application built using the Frappe Framework to manage internship workflows efficiently. It enables structured tracking of intern activities, mentor evaluation, and performance monitoring.

-----------------------------------------------------------------------------------------------------------------
Problem Statement

Traditional internship tracking is unstructured:

* No proper daily work monitoring
* Lack of mentor visibility
* No centralized performance tracking

ITMS solves this by providing a structured system.

-----------------------------------------------------------------------------------------------------------------

Features

Intern

* Submit daily work logs
* Track progress
* View attendance

Mentor

* Review submissions
* Provide feedback
* Monitor performance

 Admin

* Manage users
* Track attendance
* Generate reports

-----------------------------------------------------------------------------------------------------------------
 Tech Stack

* Frappe Framework v15
* Python
* JavaScript
* MariaDB

-----------------------------------------------------------------------------------------------------------------

 Architecture

Intern → Frappe UI → Backend → MariaDB
↓
Reports / APIs

-----------------------------------------------------------------------------------------------------------------

 Screenshots



-----------------------------------------------------------------------------------------------------------------
 Installation

bench get-app https://github.com/KhushyanKalla/itms.git
bench --site itms.local install-app itms
bench migrate

-----------------------------------------------------------------------------------------------------------------
Notes

 Some components are exported using fixtures (JSON-based)
 Project is fully functional and installable

-----------------------------------------------------------------------------------------------------------------

Future Scope

* Advanced analytics dashboard
* Notification system
* API integrations
