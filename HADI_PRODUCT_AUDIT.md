# Hadi — Product & UX Audit Report
**Audited:** hadi.hacettepe.edu.tr  
**Date:** April 11, 2026  
**Auditor context:** Senior product analyst / UX auditor / systems-thinking perspective  
**User context:** Active student — Efe Balcilar, Hacettepe Üniversitesi, İşletme (Business Administration), 8 active courses Spring 2026

---

## Areas Actually Visited

The following surfaces were directly navigated and inspected:

1. Dashboard (`/my/`) — Timeline block, Calendar block, course list sidebar
2. My Courses page (`/my/courses.php`) — card view of all enrolled courses
3. **MAN409** — Perakende Pazarlama Yönetimi (course page, grades, announcements forum)
4. **MAN407** — Teknoloji ve Yenilik Yönetimi (course page — most content-rich, forum with instructor posts)
5. **MAN413** — Türk Yönetim Kültürü (course page, Assignment 1 submission/status)
6. **MAN442** — Üretim İşlemler Yönetiminde Seçme Konular (course page, Assignment 1 submission/status)
7. **MAN426** — Hizmet Pazarlaması (course page, two assignment views — one 24 days overdue)
8. **MAN440** — Uluslararası Muhasebe Standartları (course page, quiz interface, per-course grades)
9. **MAN408** — Kalite Yönetimi (course page)
10. **AİT204** — Atatürk İlkeleri ve İnkılap Tarihi II (course page, video URL, empty announcements forum — **midterm grades distributed as XLS file**)
11. Grades overview page (`/grade/report/overview/index.php`)
12. Per-course grades — MAN409 (empty), MAN440 (10/10 on quiz)
13. Assignment detail pages — MAN426 SERVQUAL (24d overdue, never submitted), MAN413 Assignment 1 (submitted, ungraded 29 days), MAN442 Assignment 1 (submitted, ungraded 21 days)
14. Calendar — month view April 2026 (fully empty), upcoming events view (fully empty)
15. Notifications page (`/message/output/popup/notifications.php`)
16. Messages page (`/message/index.php`)
17. Profile page (`/user/profile.php`)
18. Preferences / Settings page (`/user/preferences.php`)
19. Notification Preferences page (`/message/notificationpreferences.php`)

---

## A. Executive Summary

Hadi is Hacettepe University's deployment of Moodle — a widely used open-source LMS. It is configured with minimal customization, running the standard Boost theme with Turkish localization. In practice, it functions almost entirely as a **file repository**: instructors upload weekly slide decks and documents, students download them. The platform's more sophisticated capabilities — gradebook management, calendar integration, assignment tracking, deadline alerting, workload visualization — are either unused by instructors, not properly configured, or structurally broken.

The result is a system that is technically operational but academically inert. A student can find their files. They cannot find their grades, their upcoming deadlines, any assessment of their workload, or any signal about what demands their attention now. The calendar shows zero events. The dashboard shows zero upcoming actions. Two assignments submitted weeks ago remain ungraded with no feedback. One assignment is 24 days overdue and the system has never surfaced this to the student anywhere.

The strategic opportunity for a replacement product is significant. What students need — prioritized deadlines, grade visibility, material access, workload awareness — is precisely what Hadi fails to deliver, not because the underlying Moodle capabilities don't exist, but because nobody configured them and nobody is maintaining the layer between the tool and the student.

---

## B. What Hadi Is

**Underlying technology:** Moodle LMS, version unconfirmed (Boost theme, confirmed via meta keywords and `window.M.cfg`). Deployed at `hadi.hacettepe.edu.tr`.

**Primary configured purpose:** Course material distribution. Instructors upload files by week; students access them.

**Secondary purposes (partially functional):**
- Assignment submission and status tracking
- Online quiz delivery with automatic scoring (used in one course)
- Forum-based communication between instructor and students

**Purposes that exist in the system but are not being used:**
- Calendar deadline aggregation
- Meaningful gradebook management (only one course of eight uses it properly)
- Dashboard activity timeline
- Workload visualization
- Attendance or engagement tracking

**User types the system is designed for:** Primarily students and instructors. Admin surfaces exist but were not inspected. The system makes no distinction between instructor and student views from the student perspective — both roles interact with the same weekly course structure.

**Is the product concept coherent?** No. Moodle as a platform has a coherent concept (a complete LMS), but Hadi as deployed is fragmented. The gradebook, calendar, notification system, messaging, and timeline block are all technically present but functionally disconnected from how instructors actually use the system. The gap between what the platform can do and what it actually does for students is the central product failure.

---

## C. Student Experience Audit

### Courses
Finding your courses requires navigating to "Kurslarım" from the top nav. The course card view shows full course names, which is helpful. However:

- Course codes (`MAN407_1_2526B - TEKNOLOJİ ve YENİLİK YÖNETİMİ`) still lead with the cryptic identifier before the human name. The breadcrumb in-course shows only the cryptic code.
- The sidebar on the dashboard and calendar shows raw encoded codes only: `2526B_306_534_MAN407_1`. These are completely unreadable to a student.
- Progress bars appear on course cards ("0% tamamlandı") but completion tracking is not properly configured in most courses, making this number meaningless.
- The student is simultaneously enrolled in courses from two semesters (2526B current / 2526G past), both visible, creating confusion about what is "now" vs. "archived."

### Materials
This is Hadi's core use case, and it works at a basic level.

File types found across 8 courses: PDF, PPT, PPTX, DOCX, JPG, XLS, PNG, URL. No standardization — every instructor chooses different formats and naming conventions. Notable observations:
- MAN440 uses JPG photos of worked examples (likely photographed from a textbook or whiteboard) — functional but crude
- AİT204 uses PDF lecture notes with a separate URL link to video recordings
- MAN407 embeds YouTube video links as URL activities, with "Play Video" labels
- MAN442 uses Jupyter Notebook files (.ipynb) for Python practice — the most technically sophisticated material delivery observed
- Syllabi are present in most courses (PDF or DOCX) in the General section

The weekly format creates a major navigation problem: every course page is one long scrollable page with 20+ weekly sections, most of which are empty. Future empty weeks (April 13 through June 28) are listed as blank rows. A student scrolling through MAN407 or MAN409 sees 15+ consecutive empty week headers before reaching the end of the page. There is no "jump to current week" feature that works reliably. The "Bu hafta" (This week) label appears inline but requires the student to scroll to find it.

### Grades
This is the most dysfunctional area of the product.

**Grades overview page:** Shows all enrolled courses with a "Not" (Grade) column. Current state: only MAN440 has a grade entry (10.00). Every other course shows a dash (–). This is not because grades haven't been given — it's because:

1. Most instructors are not entering grades into the Moodle gradebook at all.
2. The most egregious case: **AİT204 distributes midterm grades as an XLS file uploaded to the course page.** Students have to download a spreadsheet and find their student number to see their score. The gradebook shows nothing.

**Per-course grades:** MAN440 is the only course where the gradebook is properly configured, showing component scores (Problem Set #1: 10/10, Problem Set #2: not yet released). The grade interface itself is functional but the tab label shows a broken string: **`Son ({$a->last})`** — a raw Moodle template placeholder rendered literally in the UI.

**Assignment grading delays:** Direct observation:
- MAN413 Assignment 1: submitted March 13, 2026 → status "Puanlanmamış" (ungraded) as of April 11, 2026 — **29 days without feedback**
- MAN442 Assignment 1: submitted March 21, 2026 → status "Puanlanmamış" as of April 11, 2026 — **21 days without feedback**
- No notification, no ETA, no acknowledgment from the system

### Exams and Deadlines
There is no exam schedule in Hadi. Exam dates are not surfaced anywhere in the platform — not in the calendar, not on the dashboard, not in course pages (unless instructors manually add them as text notes in weekly sections).

Assignment deadlines are set in the course activities but **do not appear in the calendar**. The entire April 2026 calendar is blank despite multiple active courses. The dashboard Timeline block shows "Eylem gerektiren etkinlik yok" (No actions required) — incorrect, given a student has a 24-day-overdue assignment with no submission.

The most critical finding: **MAN426 SERVQUAL Group Assignment** — deadline was March 18, 2026. As of April 11, it is **24 days 23 hours overdue**. The student has never submitted it. The system shows this status only inside the specific assignment page. Nowhere else — not the dashboard, not the timeline, not any notification — surfaces this missed deadline.

### Announcements
Each course has an "Announcements" forum. Direct observation:
- MAN409: Zero announcements posted all semester
- AİT204: Zero announcements posted all semester
- MAN407: Instructor uses a separate regular forum (not the announcements forum) to post instructions and Google Forms links — content is mixed with lengthy inline text, not clean announcements

There is no centralized announcement inbox. A student must visit each of 8 course pages individually to check if anything new has been posted. The notification system is supposed to help with this, but:
- The notification page shows 7 unread but displays "select from list to view" — the list is not visible without JavaScript interaction
- The messages page shows broken template strings: **`(1 $a toplam görüşme)`** — raw Moodle template variable rendered in the UI

### Workload Visibility
Zero. There is no view in Hadi that shows a student "here is everything you have due this week" or "here is how many hours of content have been uploaded across all your courses." The workload is invisible unless you open each of 8 course pages one by one. The timeline block is configured for "next 7 days" but shows nothing.

---

## D. Instructor Experience Audit

Based on observed patterns across 8 courses:

**What instructors actually do in Hadi:**
- Upload files weekly (their primary activity)
- Occasionally post to forums for announcements or task clarifications
- Rarely enter grades into the Moodle gradebook
- Use external tools (Google Forms, Google Sheets, YouTube) when the built-in alternatives are too cumbersome — and link to them via forum posts or URL activities

**What they avoid:**
- The gradebook (only 1 of 8 courses uses it properly)
- The calendar deadline feature (no deadlines appear in the calendar)
- Structured announcements (most announcement forums are empty)
- Course completion tracking (progress bars are at 0% for most courses)

**Instructor pain points inferred:**
- The gradebook is complex to configure for non-technical staff. The path of least resistance is uploading an XLS file — which is what at least one instructor does.
- Communicating via Moodle forums requires students to be subscribed and receiving notifications — uncertain. The workaround is forum posts with full instructions embedded as text, but this creates clutter (MAN407 has a 400-word forum post with two Google Forms links embedded as raw text).
- The weekly section format forces instructors to plan uploads by calendar week rather than by topic — this may not match how they actually teach.
- No way to bulk upload materials, no drag-and-drop by topic, no course template reuse mechanism visible.

---

## E. Information Architecture & UX Audit

### Navigation structure
```
Top nav: [HACETTEPE logo] → Ana sayfa / Kontrol paneli / Kurslarım / Daha fazla
User menu: Profil / Başarı notları / Takvim / Kişisel dosyalar / Raporlar / Tercihler / Dil / Çıkış yap
```

This is Moodle's standard Boost navigation. It is functional but generic. No customization for HU's specific academic structure. The "Daha fazla" (More) dropdown in the navbar exists but contains nothing HU-specific.

### Course hierarchy
Inside a course: `Course | Participants | Grades` tabs at the top. This is clear but minimal. The "Grades" tab shows only that student's grades — no breakdown of grade components unless the instructor configured them.

### Dashboard
Two widgets: Timeline and Calendar. Both are non-functional in practice. The Timeline shows "No actions required." The Calendar shows zero events. These two widgets occupy significant page real estate on the only aggregated view a student has, and both deliver zero value.

The only useful element on the Dashboard is the course list sidebar — but it shows only cryptic codes, not course names.

### Course page UX
The weekly format with 20+ sections is the core navigation problem. On a course like MAN440 with many files per week, the page is extremely long. Files have no preview. Clicking a file navigates to an intermediate "resource" page before downloading — adding an extra click with no value.

File icons are generic (PDF icon for all PDFs, folder icon for folders) — there's no visual distinction between a syllabus, a lecture slide deck, and a worked example.

### Visual quality
Standard Moodle Boost theme. Dark blue navbar with Hacettepe branding. No custom CSS beyond institutional colors. The interface looks like a 2018-era educational portal. It functions acceptably on desktop but is cramped and scroll-heavy on mobile. Tables (gradebook) are not responsive.

### Localization quality
Mostly Turkish, but inconsistencies are significant:
- Some courses are entirely in English (MAN407, MAN440, MAN442)
- Some courses mix Turkish and English within the same page
- At least two raw Moodle template strings are rendered visibly: `Son ({$a->last})` in the grades tab, and `(1 $a toplam görüşme)` in messages
- The preferences page shows "Bilinmeyen hesap" (Unknown account) in the profile section header — likely a session or rendering bug

---

## F. Product Gaps

**1. Calendar is non-functional as a planning tool.**
The most critical gap. Every assignment deadline set in course activities should auto-populate the calendar. This is a Moodle feature that appears to be disabled or not configured. The result: the calendar shows nothing, and students have no system-level visibility into upcoming deadlines.

**2. No missed-deadline alerting.**
A student is 24 days overdue on a group assignment. The system has never alerted them. No banner, no email, no dashboard indicator. This is not a design limitation of Moodle — it's a configuration gap.

**3. Grades not centralized.**
Of 8 active courses, 7 show no grades in the gradebook. One instructor distributes grades as a downloadable XLS file. Students must go hunting — opening individual course pages, downloading files, searching for their student number in a spreadsheet. The "Başarı notları" overview is nearly empty and cannot be trusted as a source of truth.

**4. No workload aggregation.**
There is no view that shows a student their total academic demand this week: files uploaded, assignments due, quizzes open, etc. across all courses. Everything requires course-by-course manual inspection.

**5. Communication is fragmented and inconsistent.**
Instructor communication happens through a patchwork: empty announcement forums, informal forum posts with embedded links, external Google Forms links pasted as raw text, external Google Sheets for group coordination. There is no consistent channel.

**6. Dashboard delivers no value.**
The two main widgets (Timeline and Calendar) are both non-functional. The Dashboard is the student's first view after login and it communicates nothing useful.

**7. Course sidebar uses unreadable codes.**
The course list in the sidebar and calendar always shows `2526B_306_534_MAN407_1` instead of "Teknoloji ve Yenilik Yönetimi." This is a basic data display failure that creates unnecessary cognitive friction on every page.

**8. Assignment feedback loop is broken.**
Assignments submitted weeks ago have no grades, no comments, no ETA. The system shows "Puanlanmamış" (Ungraded) indefinitely. There's no pressure on the instructor side visible, no student expectation surfaced.

**9. No exam schedule integration.**
Exam dates are not in the system. The university presumably manages exam schedules separately. This means students cannot see their exam schedule from within Hadi at all.

**10. Technical quality issues.**
Two broken template strings rendered literally in the UI (`{$a->last}`, `$a toplam görüşme`). These indicate the Turkish localization files have incomplete string replacements that have persisted unnoticed — which tells you something about how actively the system is maintained.

---

## G. Likely Student Pain Points

Based on direct observation, these are the most credible real-world frustrations:

1. **"I open Hadi every week to check if new slides are uploaded. That's it. It doesn't tell me anything else."** The system's only reliable signal is "new file uploaded." Everything else requires proactive manual hunting.

2. **"I have no idea what my grades are."** Seven of eight courses show no grades. The one that does, delivers results well. The others either haven't graded yet (3+ weeks after submission) or route grades through a downloaded spreadsheet. A student trying to understand how they're doing academically gets almost no signal from Hadi.

3. **"I missed a deadline I didn't know existed."** The SERVQUAL assignment — 24 days overdue, never submitted — is the clearest evidence. The system set the deadline, the student apparently never noticed, and nothing in the system surfaced it at any point. This is not a student attention problem. It's a system design failure.

4. **"Finding this week's slides requires scrolling through the whole page."** The weekly format with 20+ sections (mostly empty) on every course page means every visit to a course involves significant scroll work. There's no "jump to current week" mechanism that works without JavaScript loading.

5. **"My instructor announced something on Hadi but I missed it."** Since most announcements come through standard forum posts rather than the Announcements forum, and since forum subscription notifications are unreliable, students miss course-critical information. MAN407 has a multi-paragraph forum post with embedded Google Forms links — this is how a survey deadline was communicated.

6. **"To download the midterm grades I have to open an Excel file and find my student number."** The AİT204 XLS grade file approach is particularly poor. A student must: navigate to the course, find the right weekly section, download the file, open it, search for their student number. The Moodle gradebook sits unused while this workaround exists.

7. **"I submitted my assignment three weeks ago and I still have no idea if it's been graded."** Two assignments confirmed ungraded after 21 and 29 days respectively. No feedback, no timeline, no acknowledgment beyond "Puanlanmamış."

8. **"I have to open 8 different course pages to know what's going on."** No aggregated view of any kind works. The Dashboard, Calendar, and Timeline all show nothing useful. Students either open everything manually or miss things.

9. **"The course codes mean nothing to me."** Course codes like `2526B_305_305_AİT204_62` appear in breadcrumbs, sidebars, and calendar labels throughout the system. Students know their course names but the system frequently shows only codes.

10. **"The exams aren't even in here."** Final exams and midterm dates are not in Hadi at all. Students are managing exam dates from a separate source (presumably university announcements, WhatsApp group chats, or physical notice boards).

---

## H. Strategic Opportunity Map

### What should definitely be preserved
- The core file repository concept — instructors do upload materials and students do need to access them. This behavior is established and reliable.
- The per-course gradebook for courses that use it (MAN440 is a good example of what's possible)
- The assignment submission flow — it works, it records submission time, it shows status
- The quiz/online problem set capability (MAN440 Problem Sets) — auto-scored, feedback-rich

### What should be redesigned
- The Dashboard — it should be the student's command center: upcoming deadlines, recent materials, unread announcements, grade updates, all courses in one glance. Currently it's a blank slate.
- The calendar — it should auto-populate from all course activities. The underlying Moodle feature exists; it just needs to be configured and trusted.
- The course page — the weekly infinite scroll needs to be replaced with a "what's now" view: current week first, future weeks collapsed, past weeks accessible but deprioritized.
- The grades surface — there should be one reliable place where a student can see their academic standing across all courses. The current overview is nearly empty and cannot serve this purpose.
- Course navigation labels — course codes should never appear as primary identifiers. Course names should be primary everywhere.

### What should be removed
- Empty future week sections (or collapse them by default)
- Redundant/overlapping navigation elements (the "Haftalık özet" tab appears identical to the course view)
- The dual-semester course list mix (current and previous semester in the same "My Courses" view without separation)

### What should be reimagined from scratch
- **Deadline and workload visibility.** The current system has zero capacity to tell a student "here is everything you owe across all courses this week." This needs to be built as a first-class feature, not a calendar widget that nobody configured.
- **Grade transparency.** A student needs to see: what has been graded, what is pending, what hasn't been submitted. The current fragmented state (some in gradebook, some in XLS, some nowhere) is untenable. A better system normalizes this.
- **The announcement/communication layer.** Instructor posts buried in course forums, raw Google Forms links in 400-word text blocks, external Google Sheets for group coordination — all of this represents a communication layer that Moodle has never solved well. A modern replacement would surface instructor communications per-course and aggregated, with reliable push delivery.
- **The notification and alert system.** The missed-deadline case (24 days overdue, zero system alert) is the clearest argument for building this properly. A good system sends escalating alerts: 3 days before deadline, 1 day before, on the day, and when overdue.

---

## I. Best Wedge / Entry Strategy

Do not try to replace Hadi. That requires institutional buy-in, IT integration, instructor retraining, and administrative processes that take years. The right strategy is to build a **student-facing intelligence layer** that reads from Hadi but presents it better.

**The most powerful wedge is deadline and workload visibility.**

Here is why: The core failure of Hadi is not that the data doesn't exist — it's that the data is buried. Exam dates, assignment deadlines, uploaded materials, grade status: all of this is technically accessible via Moodle's mobile app or web scraping. A product that aggregates this information and presents it in a student-useful way — "here is what you owe this week, here is what's been graded, here is what you're at risk of missing" — solves the #1 student pain point without requiring any instructor behavior change.

**This is the entry point:** Build the planning and deadline layer that Hadi refuses to provide.

**Specific wedge mechanics:**
- Students connect their Hadi account (OAuth or credential pass-through if available, otherwise manual entry)
- The product scrapes/reads enrolled courses, uploaded materials, assignment deadlines, submission statuses, and any gradebook data
- It presents: upcoming deadlines across all courses, overdue items with urgency, ungraded submissions (with elapsed time), new materials since last visit
- Over time, it adds: study planning, workload estimation, exam preparation tracking

**Why this wins:** It doesn't require any instructor to change behavior. It doesn't require university approval. It works with the system as it is. And it solves the problem students actually feel every day — not knowing what matters and when.

**The next wedge** (after establishing deadline visibility): grade transparency and exam tracking. Once students are in the habit of using the product for deadlines, adding grade aggregation and exam date management is natural.

**What to avoid:** Building features that depend on instructor cooperation (e.g., richer announcements, assignment feedback flows, course material organization). These require the instructor to change their behavior in Hadi — which they demonstrably won't. The product should be valuable based on what students already do, not what instructors should do.

---

## J. Final Verdict

### Top 5 Strengths
1. **It works as a file repository.** For the core use case instructors actually use — uploading slides and PDFs by week — Hadi is reliable. Files get uploaded, students can download them.
2. **The per-course gradebook is good when used.** MAN440's quiz scores with immediate auto-grading, grade breakdown, and review capability is genuinely useful. The infrastructure works.
3. **Assignment submission tracking.** The system correctly records submission timestamps, submission status, and late indicators. The data is there — it's just not surfaced anywhere useful.
4. **Multi-format file support.** Instructors can upload any file type — PDF, PPT, PPTX, DOCX, XLS, PNG, JPG, Jupyter Notebooks. The system doesn't restrict formats.
5. **Forum-based communication works at a basic level.** When instructors do post to forums, students can read the content inline on the course page without leaving the context.

### Top 10 Weaknesses
1. **Calendar is completely non-functional** — zero events in April 2026 despite 8 active courses
2. **Dashboard provides zero actionable information** — Timeline block shows "no actions needed" while a student is 24 days overdue on an assignment
3. **Grades are not centralized** — 7 of 8 courses show no gradebook data; one course distributes grades as a downloaded XLS file
4. **No missed-deadline alerting** — a student can be 24+ days overdue without a single system notification
5. **Course codes appear as primary identifiers** throughout the UI instead of human-readable course names
6. **Assignments go weeks without grading feedback** — 21-day and 29-day waits observed with no system pressure or ETA
7. **Broken localization strings rendered in the UI** — `Son ({$a->last})`, `(1 $a toplam görüşme)` — visible technical failures
8. **No aggregated workload view** — students must open 8 course pages individually to understand their weekly obligations
9. **Empty future weeks dominate course pages** — each course page has 10-15 consecutive empty week sections creating heavy scroll overhead
10. **No exam schedule** — final and midterm exam dates are not in the system at all

### Biggest Student Pain Points (priority order)
1. Missing deadlines because nothing surfaces them
2. Not knowing grades for weeks or months
3. Having to check 8 course pages individually to know what's new
4. The calendar being completely empty while managing a real academic schedule
5. The dashboard being useless on first login

### Biggest Strategic Opportunities
1. **Deadline aggregation + overdue alerting** — no behavior change required from instructors, solves the #1 student pain point
2. **Grade visibility layer** — aggregate what's graded, what's pending, what's unsubmitted, regardless of whether it's in the Moodle gradebook or an XLS file
3. **"What matters now" dashboard** — a single view that answers: what is due, what is overdue, what is new, what is my current standing — across all courses simultaneously
4. **Exam tracking** — the exam schedule isn't in Hadi at all, creating an obvious gap a student-facing product can fill with manual or integrated exam date entry
5. **Workload planning** — if deadline data is captured, workload planning (hours needed, available time, risk by subject) becomes possible with modest additional logic

### Replaceability Assessment
**Hadi is replaceable at the student-facing layer, not at the institutional layer.** The institutional LMS will stay — instructors upload to it, it handles submission records, it is the system of record. But the student experience of that system is so poor that a parallel product that reads from Hadi and presents it better would quickly become the primary interface students actually use.

The analogy: Hadi is like a filing cabinet. A good student product is the smart desk you put in front of it — the place where work actually gets organized and prioritized. You don't replace the filing cabinet. You make it irrelevant to daily experience.

### Recommended Starting Point
Build a product that does one thing better than Hadi does anything: **tell a student what they need to do next, and when.**

That means: deadline aggregation across all enrolled courses, overdue detection, new-material notification, and a single ordered to-do view for the academic week. No grade features, no materials viewer, no social layer at launch. Just a reliable, honest answer to "what should I be doing right now?" — the question Hadi never answers.

Once students trust that signal, every adjacent feature (grades, study planning, exam tracking) becomes credible and valuable.

---

*Report based on direct live navigation of hadi.hacettepe.edu.tr on April 11, 2026. All observations are from actual page content — no inferences beyond what was directly readable from the rendered UI.*
