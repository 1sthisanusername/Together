# Together: User Manual and Journey Checklist

*What the app should do, step by step, for a couple using it. This covers behaviour only, not looks. Use it to test the app on two phones (Phone A and Phone B). Items marked (assumed) are decisions I made where your notes were open, so change them if you disagree.*

---

## 1. Getting started (new user)

**1.1 Sign in**

- The welcome screen has one button: **Continue with Google**. There is no email, password or other sign-in option.
- After choosing a Google account, the app signs the user in. If the same account has signed in before, it skips the steps below that are already done.

**1.2 Choose a nickname**

- The app asks: "What should your partner call you?"
- The user either types a nickname, or taps **Let my partner choose**.
- If they let their partner choose, the partner is asked to name them right after the two are linked. Until then, their Google first name is shown.
- Nicknames can be changed later in Settings.

**1.3 Link with your partner**

- The user picks **Create a code** or **Enter my partner's code**.
- **Create a code:** the app shows a code and a share link, plus resend and cancel. The screen says "Waiting for your partner" until they join.
- **Enter a code:** the user types the code. A valid code links them at once.
- A code works once, expires after 48 hours, and cannot be used by a third person.
- A person cannot be in two couples at once, and a couple has exactly two people.

**1.4 "Since when are you together?" (new couples only)**

- Right after linking, one popup asks for the date the couple got together, using a date picker. Future dates are not allowed.
- Either partner can answer it. Once a date is set, it never appears again for either partner.
- The user can skip it and add the date later in Us.
- The other partner sees the date and gets a notification that it was set.

**1.5 Land on Home.**

---

## 2. Home

From top to bottom:

1. **Header:** the title "Together". Under it, both names as "Name ❤ Name". Under that, the time you've been together, either as **days only** or **years, months and days**, depending on the user's setting. There is no separate big "Together for..." card.
2.
3. **Partner in an activity:** a "Join" banner appears only while the partner is really inside an activity right now. If they are offline, or the activity was abandoned, it is hidden. Old unfinished sessions expire on their own after a short while.
4. **Partner's quick photo:** the latest photo your partner took with the camera button (see section 3) shows near the top, so it is the first thing you see after opening the app.
5. **Daily question:** see section 6.
6. **Time card:** your time and your partner's time. It shows the difference correctly (for example "3h 30m ahead"), or "Same time zone" when equal. It never shows "NaN".
7. **Next reunion countdown:** days left until the next meeting date, if one is set. If none is set, it offers to set one.
8. **Header buttons:** notifications (with an unread count), chat, and settings.

Everything scrolls fully, and nothing is hidden behind the bottom bar.

---

## 3. Bottom bar and quick photo

**3.1 Tabs:** Home, Play, **Camera** (centre button), Memories, Us. There is no Dates tab.

**3.2 Swiping:** swiping left or right on a main screen moves to the neighbouring tab. Swiping inside a list or a game does not change tabs by accident.

**3.3 Quick photo (camera button)**

1. Tap the centre button. The phone camera opens.
2. Take a photo. A preview appears with **Send** and **Retake**.
3. Tap Send. The photo is compressed and uploaded, and it becomes your current photo on your partner's Home.
4. Your partner gets an in-app notification.
5. Only the latest photo per person is shown. Sending a new one replaces the old one.
6. The photo is upright, never sideways.
7. Saving a quick photo as a memory is optional and never automatic (assumed).

---

## 4. Chat (open from the chat button on Home)

**4.1 Text:** type, send. The message appears at once on your phone (sending), then confirms as sent. It reaches your partner within a second or two while both have the app open.

**4.2 Layout behaviour**

- The input bar sits right above the keyboard and is fully visible.
- New messages, sent or received, stay visible above the input bar and never hide behind the keyboard.
- After sending, the list moves to the newest message.

**4.3 Photos:** the gallery button picks a photo and the camera button takes one. Either one sends a **photo message**, never a voice note. Tapping a photo opens it full screen.

**4.4 Voice notes**

- Hold the mic to record. A timer shows. Slide left to cancel. Release to send.
- A quick tap shows a hint ("Hold to record").
- Maximum 2 minutes. An empty recording is never sent.
- The partner taps play. The note plays with the right length, and shows a progress bar and playback speed.
- If a note cannot be played, the app says so and stays open.

**4.5 Deleting:** a user can delete their own messages and voice notes. They disappear for both people.

**4.6 Offline:** a message written offline is held and sent when the connection returns, once only.

---

## 5. Play

**5.1 What shows**

- Quiz-style games: **Would You Rather, Who Knows Whom Better, Guess My Answer**, and the quizzes (How well do you know me, Memories together, Favourite things, Relationship questions, Future dreams, Funny and random).
- Challenges and photo missions, including the **Daily Photo Mission**.
- Hidden until in-app voice or video exists (assumed): **Drawing and Guessing**, shared date rooms, guided virtual dates, and anything that needs both partners online at the same time.

**5.2 Playing a quiz-style game**

- Choose **Play alone** or **Play together**.
- **Play alone:** you answer in your own time. Your partner answers later. Answers are revealed when both have answered, and each of you gets a notification when the other finishes.
- **Play together:** your partner is invited. Both answer. The results show only when both have answered, and the next round moves for both phones at the same time, with a note saying who moved it.
- Tapping an option selects it. The answer is saved once, even if tapped twice.
- After submitting, the button changes colour or text and is disabled.
- Your partner's answer is hidden from you until you have both answered. This is enforced by the database.
- The result screen shows matches and mismatches, with replay and an optional "Save as a memory".
- If someone leaves or loses signal, their progress is kept and they can come back.

**5.3 Daily Photo Mission**

- A prompt such as "Take a photo of what's in front of you right now".
- Each partner takes or picks a photo and sends it, optionally with a caption.
- Neither sees the other's photo until both have sent theirs. Then both are revealed.
- Submitting changes the button and disables it. Errors show a friendly message in the app style.

**5.4 Challenges:** simple tasks (selfie, something that reminds you of them, same colour, three words about your partner, voice message, one thing you appreciate). A partner can complete theirs without the other being online.

---

## 6. Daily question (on Home)

1. One question per day. Both partners always see the same question at the same time.
2. Each person types their answer once and taps submit. The button then changes and is disabled.
3. Until you have both answered, you can see only your own answer, and a note says whether your partner has answered.
4. When both have answered, each person sees both answers.
5. The partner gets a notification when you answer.
6. The question changes once per day (the day changes at midnight UTC, assumed). Old answers can be saved as a memory by choice.

---

## 7. Open When letters

**7.1 Writing a letter**

- Choose an occasion (miss me, lonely, bad day, birthday, meet again, or custom).
- Add text, **photos** and a **voice note**.
- Pick the unlock date and time with a date picker.
- Send. The sender can still see the letter and its status.

**7.2 Receiving a letter**

- Before the unlock time, the partner sees only a **sealed envelope with a countdown**. Nothing inside is readable.
- At the unlock time, the unlock is decided by the server, not the phone's clock.
- When the partner opens the app after that, a **popup** announces the letter with two choices: **Open now** or **Open later**.
- **Open later** closes the popup. It returns the next time the app is opened, until the letter is opened. The wording is warm, never pressuring.
- **Open now** shows the text, photos and a playable voice note. The letter is then marked opened and the popup stops.
- Letters live in the Memories tab, in a Letters section

---

## 8. Memories

1. Open the Memories tab. It shows the timeline of memories, with a Letters section next to it.
2. **Add a memory:** title, note, date (date picker), and up to **5 photos** (from gallery or camera). Photos upload with progress, and a failed upload can be retried. Tapping Save twice makes only one memory.
3. Both partners see the memory and can add to it.
4. **Delete:** the person who added a memory or photo can delete it. It disappears for both, and the files are removed from storage.
5. Nothing is saved as a memory automatically. It is always the user's choice.

---

## 9. Us

- **Couple profile:** names, photos, time zones.
- **Next meeting countdown:** set a date with a date picker. It must be in the future.
- **Important dates:** add, edit and delete dates (first date, anniversaries), with a yearly repeat option. Each shows who added it.
- **Anniversary menu:** a menu inside the anniversary section holds editing of "together since" and the milestone view (100, 200, 365 days, each year, with the next one counting down). Anniversaries and milestones send a warm notification to both people (assumed).
- **Shared bucket list:** opens as its **own full screen** from Us. Add, edit, complete and delete items. Each shows who added it.

---

## 10. Notifications

- A bell on Home shows the unread count. The inbox lists notifications, newest first, unread ones highlighted, with **Mark all as read**.
- While the app is open, a small banner appears when something arrives.
- Types: new message, voice note, photo, letter unlocked, daily question answered, mission or quiz finished, quick photo, memory added, anniversary or milestone, partner set a date.
- Tapping one opens the right screen. It must behave the same whether it is unread or already read.
- Real phone push notifications are there if permission is given for push notification else in app notification only.
- The wording never makes the user feel guilty.

---

## 11. Settings

- **Nickname:** change your own nickname.
- **Time zone:** pick from a searchable list, with the phone's zone preselected.
- **Day count style:** days only, or years, months and days.
- **Notifications:** turn categories on or off, set quiet hours.
- **Backup and restore:** see section 12.
- **Menu button (⋮):** contains **Sign out** and **Unlink couple**. They are not loose in the main list.
- **Sign out:** returns to the welcome screen and clears the couple data on the phone.
- **Unlink couple:** asks for confirmation and explains what happens. Both phones then go to the setup or waiting screen at the same time. Shared content stops being readable straight away, and is kept for 30 days in case it was a mistake, then deleted (assumed). A new code can then be created.
- **Delete account:** removes the user's personal data and media.

---

## 12. Data, backup and restore (target behaviour)

- **Text and details** (messages, answers, dates) are stored on the server so both phones stay in sync. They are tiny.
- **Photos, voice notes and letter attachments** are the big files. The app keeps a copy on each person's phone. The server holds a file only until the partner has received it, then removes it (assumed, with a maximum of 30 days if the partner never opens the app).
- **Backup to the user's own Google account:** in Settings the user chooses which Google account to use (their signed-in one by default) and how often: daily, weekly, monthly, manual only, or the suggested default (weekly on Wi-Fi, assumed). The backup lives in a private app folder in their Google Drive and uses their own space.
- **Back up now** button, with the date of the last backup.
- **Restore:** after signing in on a new phone, the app offers to restore from the backup and shows what it found. Restoring brings back messages, photos, voice notes and memories.
- Backups never include anything the other partner deleted for both.

---

## 13. Rules that always apply

1. Only the two linked partners can see the couple's content. A third account sees nothing.
2. A partner's answers (quiz, daily question, photo mission) stay hidden until both have answered. The database enforces it.
3. Every action works once. A double tap or a weak connection never creates duplicates.
4. Times show in each person's own time zone. Dates without a time (anniversary) never shift.
5. Errors appear as friendly messages in the app's style. A raw database error is never shown.
6. No pressure: no streaks, scores of love, "you haven't opened the app" messages, or read receipts (except a voice note's "played").
7. Nothing is shared or saved as a memory without the user choosing it.

---

## 14. Quick two-phone test checklist

1. Sign in with Google on both phones. Nickname set, one phone chooses "let my partner choose", the other names them.
2. Link with a code. The "since when" popup shows once only.
3. Home on both: names, day count, string reacts when one phone closes the app.
4. Take a quick photo on A. B sees it on Home.
5. Chat: send text, photo and voice note both ways. All arrive quickly and play. Last message stays visible above the keyboard.
6. Daily question: A answers, B sees "waiting". B answers, both see both answers.
7. Quiz alone on A, later on B. Answers reveal only after both. Then play one together.
8. Daily Photo Mission both ways, revealed only when both are sent.
9. Letter from A with a photo and voice note, unlock set a few minutes ahead. B sees a sealed card, then the popup. "Open later" returns it next time. "Open now" opens it.
10. Memory with 2 photos on A. B sees it. Delete it. It disappears on both.
11. Bucket list opens as its own screen. Add, edit and complete an item.
12. Notification inbox: tap an unread and a read item. Both open the right screen.
13. Swipe between tabs. The camera button is in the middle. There is no Dates tab.
14. Unlink from the Settings menu. Both phones go to the setup or waiting screen.
15. Hidden items: Drawing and Guessing and guided dates do not appear.
