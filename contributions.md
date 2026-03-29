# Contributions

Every member has to complete at least 2 meaningful tasks per week, where a
single development task should have a granularity of 0.5-1 day. The completed
tasks have to be shown in the weekly TA meetings. You have one "Joker" to miss
one weekly TA meeting and another "Joker" to once skip continuous progress over
the remaining weeks of the course. Please note that you cannot make up for
"missed" continuous progress, but you can "work ahead" by completing twice the
amount of work in one week to skip progress on a subsequent week without using
your "Joker". Please communicate your planning **ahead of time**.

Note: If a team member fails to show continuous progress after using their
Joker, they will individually fail the overall course (unless there is a valid
reason).

**You MUST**:

- Have two meaningful contributions per week.

**You CAN**:

- Have more than one commit per contribution.
- Have more than two contributions per week.
- Link issues to contributions descriptions for better traceability.

**You CANNOT**:

- Link the same commit more than once.
- Use a commit authored by another GitHub user.

---

## Contributions Week 1 - [Begin Date] to [End Date]

| **Student**        | **Date**     | **Link to Commit**                                                                                                     | **Description**                                                                                                                                                                              | **Relevance**                                                                                                                   |
|--------------------|--------------|------------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------------------|
| **[@Monato11]**    | [23.03.2026] | [ https://github.com/MaricBoris/sopra-fs26-group-14-server/pull/238/commits/0f7e29d5addb3faa711e9ecba3dace718a589bc6 ] | [The creation of the User entity with the respective attributes that are required alongside getter and setter methods. https://github.com/MaricBoris/sopra-fs26-group-14-server/issues/215 ] | [This is mandatory for storing/editing and later on using the Information of Players for game flow and Authentication.]         |
|                    | [23.03.2026] | [ https://github.com/MaricBoris/sopra-fs26-group-14-server/pull/238/commits/d3953c4194985acab4e67465ad29d04149f5f907 ] | [Implementation of the POST /users endpoint. https://github.com/MaricBoris/sopra-fs26-group-14-server/issues/39 ]                                                                            | [The Players can register a new account which is mandatory for the game.]                                                       |
|                    | [23.03.2026] | [ https://github.com/MaricBoris/sopra-fs26-group-14-server/pull/238/commits/a13f960d44601c33692d17df895d7e92e6ff7e7b ] | [Implementation of the POST /users/login endpoint. https://github.com/MaricBoris/sopra-fs26-group-14-server/issues/43 ]                                                                      | [The Players can login now, so they can make use of the same account. They also get a new token in order to increase security.] |
|                    | [23.03.2026] | [ https://github.com/MaricBoris/sopra-fs26-group-14-server/pull/238/commits/58d9c2769f11a9d6e5c1c8b5335305e1ea0173e2 ] | [Implementation of the POST /users/logout endpoint. https://github.com/MaricBoris/sopra-fs26-group-14-server/issues/47 ]                                                                     | [The Players can logout when they don't want to play anymore which resets their token as well in order to increase security.]   |
| **[@thomashonzi]** | [24.03.2026]       | [ https://github.com/MaricBoris/sopra-fs26-group-14-client/commit/466ece1d2ab578839c76fe9583e16fd19778b80e ]                                                                                                     | [Created the layout/design of the the Frontpage. Added buttons to navigate to Stories, Lobby, Profile.]                                                                                                                                                              | [The user has now an interface and can navigate to the respective pages.]                                                                                             |
|                    | [25.03.2026]       | [ https://github.com/MaricBoris/sopra-fs26-group-14-client/commit/b3945e859ba049565dc01813f0aa242e60a17b89 ]                                                                                                     | [Added Login, Logout and Register buttons. Various design changes to finalize the structure/layout of the homepage.]                                                                                                                                                              | [The user now has a way to access the registration process of the page. The (relatively) finalized layout gives everyone a FE structure to work with.]
|                    | [26.03.2026]       | [ https://github.com/MaricBoris/sopra-fs26-group-14-client/commit/a45fcd231a65a0bc136798036e68748fd044022a ]                                                                                                     | [Final Frontpage touch ups. Added buttons with conditional visibility (Login, Register, Logout). Created Login and Registration pages with all buttons. Routings of buttons on these pages. Token & userid localstorage handling. Error messages. User/id page design adjustments.]                                                                                                                                                              | [The user now has a full interface to Register and Login on the homepage and is re-routed correctly. All pages have a consistent design for clarity. Emphasized two error messages for clarity.]                                                                                             |
| **[@AntoGrgic49]** | [24.03.2026]       | [https://github.com/MaricBoris/sopra-fs26-group-14-server/commit/b9fb5e9c5f53405351025fc47c8e619b88b5d2571]                                                                                                     | [Implementation of GET /users/id endpoint, with autorization check]                                                                                                                                                              | [The Player can now see their profile information]                                                                                             |
|                    | [26.03.2026]       | [https://github.com/MaricBoris/sopra-fs26-group-14-client/commit/0c54143337367a013b283437d35ec84d4cf97a762]                                                                                                     | [Set up of all the API structure (Added authorization token to all 4 calls, also added a body for DELETE endpoint as required by REST specification. Modification of the LocalStorage Hook, so that the value gets loaded at declaration, and set up of front page /users/id, with user info, logout and home button)]                                                                                                                                                              | [Now all end API calls can handle token id, so we can check for authorization. The DELETE call can now check for the password again so it had two level of authorization, then the localstorage now won't have syncronization problems (being used before it get's loaded). Additionally the user can now visit his own page, see his profile, and log out from it, or go to home]                                                                                             |
| **[@githubUser4]** | [date]       | [Link to Commit 1]                                                                                                     | [Brief description of the task]                                                                                                                                                              | [Why this contribution is relevant]                                                                                             |
|                    | [date]       | [Link to Commit 2]                                                                                                     | [Brief description of the task]                                                                                                                                                              | [Why this contribution is relevant]                                                                                             |

---

## Contributions Week 2 - [Begin Date] to [End Date]

| **Student**        | **Date** | **Link to Commit** | **Description**                 | **Relevance**                       |
| ------------------ | -------- | ------------------ | ------------------------------- | ----------------------------------- |
| **[@githubUser1]** | [date]   | [Link to Commit 1] | [Brief description of the task] | [Why this contribution is relevant] |
|                    | [date]   | [Link to Commit 2] | [Brief description of the task] | [Why this contribution is relevant] |
| **[@githubUser2]** | [date]   | [Link to Commit 1] | [Brief description of the task] | [Why this contribution is relevant] |
|                    | [date]   | [Link to Commit 2] | [Brief description of the task] | [Why this contribution is relevant] |
| **[@githubUser3]** | [date]   | [Link to Commit 1] | [Brief description of the task] | [Why this contribution is relevant] |
|                    | [date]   | [Link to Commit 2] | [Brief description of the task] | [Why this contribution is relevant] |
| **[@githubUser4]** | [date]   | [Link to Commit 1] | [Brief description of the task] | [Why this contribution is relevant] |
|                    | [date]   | [Link to Commit 2] | [Brief description of the task] | [Why this contribution is relevant] |

---

## Contributions Week 3 - [Begin Date] to [End Date]

_Continue with the same table format as above._

---

## Contributions Week 4 - [Begin Date] to [End Date]

_Continue with the same table format as above._

---

## Contributions Week 5 - [Begin Date] to [End Date]

_Continue with the same table format as above._

---

## Contributions Week 6 - [Begin Date] to [End Date]

_Continue with the same table format as above._
