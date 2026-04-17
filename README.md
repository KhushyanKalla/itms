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
## 📸 Screenshots

<p align="center">
 <img width="800" alt="image" src="https://github.com/user-attachments/assets/9ce195d2-b033-468e-832d-800f1e97936e" />
</p>

<p align="center">
  <img width="800" alt="image" src="https://github.com/user-attachments/assets/ca1cf386-23d8-421a-bfd6-3344a0e8df6f" />
</p>

<p align="center">
  <img width="800" alt="image" src="https://github.com/user-attachments/assets/ff6a75e9-8edb-4474-8a08-a8a22238dafb" />

</p>


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
