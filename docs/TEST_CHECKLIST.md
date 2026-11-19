<!-- Owner: Yassin Awny. What it is: every test to run on the final version before submitting, one table per requirement. -->

# Sahaan test checklist

**Before you start:** run `npm run db:setup`, then `npm start`, and open http://localhost:3000. Use a private/incognito window, or log out between roles.
Demo passwords: admin `Admin123`, owners `Owner123`, customers `Customer123`.
Tick ✓ when the result matches. If something fails, write down the steps and send them to the file's owner.

Tests marked **(curl)** check the server directly, because the browser hides those buttons. Copy each command into a terminal (Mac Terminal, or Git Bash on Windows). To get a token, log in with curl first:

```bash
curl -s -X POST http://localhost:3000/api/auth/login -H "Content-Type: application/json" -d '{"email":"customer1@sahaan.test","password":"Customer123"}'
```

Copy the `token` value from the answer and use it in place of `TOKEN` below. Add `-i` to any curl command to see the status code.

---

## FR1: Accounts (Yasin)

| # | Steps | Expected result | ✓ |
|---|---|---|---|
| 1.1 | Register: submit the empty form | An error under Full name, Email and Password; nothing is sent | |
| 1.2 | Register with password `abcdefgh` | "Password must contain at least one letter and one number." | |
| 1.3 | Register as "I'm a customer" with a new email and password `Testing123` | "Your account is ready…", then the home page; header shows My reviews, Profile, your name, Log out | |
| 1.4 | Register again with the same email (any capitals) | "An account with this email already exists." | |
| 1.5 | Register as "I own a restaurant" | Goes to My restaurants with "You haven't added a restaurant yet" | |
| 1.6 | Log in with a wrong password, then with an unknown email | Both show the same "Wrong email or password." | |
| 1.7 | Log in as customer1 | "Welcome back, Aisha Karim!", then the home page | |
| 1.8 | Log in as owner1 / admin | Owner goes to My restaurants; admin goes to Admin | |
| 1.9 | Profile: change your name to "A" | "Full name must be 2 to 60 characters." | |
| 1.10 | Profile: change your email to customer2@sahaan.test | "Another account already uses this email." | |
| 1.11 | Profile: change your name to a valid one | "Your details have been saved." and the header shows the new name | |
| 1.12 | Change password with a wrong current password | "Your current password is not correct." | |
| 1.13 | Change password correctly, log out, log in with the new password | Works; the old password no longer works | |
| 1.14 | Click Log out | Back to the home page; header shows Log in and Register | |

## FR2: Search and filters (Yasin)

| # | Steps | Expected result | ✓ |
|---|---|---|---|
| 2.1 | Open the home page | "10 restaurants" as cards, top rated first | |
| 2.2 | Type `biryani` (a dish, not a name) | After a short pause: Karama Spice Box only | |
| 2.3 | Type `lebanese` | Cedar Lantern (matches the cuisine) | |
| 2.4 | Clear the box; Cuisine = Italian, Location = Downtown Dubai | Results change at once: Nonna Lucia's Table | |
| 2.5 | Clear filters; Price = $ Budget, Minimum rating = 4 and up | Lahore Lane Grill only | |
| 2.6 | Sort by Name, then Newest | A to Z; then Bean & Date Café first | |
| 2.7 | Type `zzzz` | "No restaurants match your filters" with a Clear filters button | |
| 2.8 | Click Clear filters | All 10 restaurants again | |
| 2.9 | Set some filters, then reload the page (Web Storage) | The same filters come back with "Showing your last search, saved in this browser." | |
| 2.10 | Search for `' OR 1=1 --` | No error and 0 restaurants | |
| 2.11 | **(curl)** `curl -i "http://localhost:3000/api/restaurants?cuisine=Martian"` | 400 `{"error":"Choose a cuisine from the list."}` | |
| 2.12 | **(curl)** `curl -i "http://localhost:3000/api/restaurants?sort=hack"` | 400 `{"error":"Sort must be rating, name or newest."}` | |

## FR3: View restaurants, menus and reviews (Danish)

| # | Steps | Expected result | ✓ |
|---|---|---|---|
| 3.1 | Click the Sidr Tree Kitchen card | Name, stars 4.7 (3 reviews), Emirati, Jumeirah, $$$ Upscale, "Open: Daily 12:00-23:00", description, "Listed by Omar Haddad" | |
| 3.2 | Look at the menu | 5 items with prices like "AED 68.00" | |
| 3.3 | Look at the reviews | Stars, name, date and comment, newest first | |
| 3.4 | Open Saffron Courtyard | "No reviews yet" and "No reviews yet. Be the first…" | |
| 3.5 | Log out and open any restaurant | "Log in to write a review." with a link | |
| 3.6 | Open `restaurant.html?id=999` and `restaurant.html?id=abc` | "Restaurant not found" with a way back | |

## FR4: Write, edit and delete your own reviews (Danish)

| # | Steps | Expected result | ✓ |
|---|---|---|---|
| 4.1 | As customer1, open Little Bosphorus Grill | "Write a review" form with 5 stars and a "0 / 500" counter | |
| 4.2 | Post without stars and with comment `ok` | "Choose a rating from 1 to 5 stars." and "Comment must be 5 to 500 characters." | |
| 4.3 | Type a comment and watch the counter | It counts up and is red under 5 characters | |
| 4.4 | Choose 4 stars, write a proper comment, post | "Thank you! Your review has been posted."; it appears with a "You" tag; the average changes | |
| 4.5 | Write a review containing `<b>hi</b>` | It shows the tags as plain text, not bold | |
| 4.6 | Click Edit on "Your review", change the stars, Save | "Your review has been updated." | |
| 4.7 | Click Delete, then OK | "Your review has been deleted." and the form is back | |
| 4.8 | Open My reviews | Your reviews with restaurant links; Edit works inline; Delete asks first | |
| 4.9 | As an owner or admin, open a restaurant | "Only customer accounts can write reviews." | |
| 4.10 | **(curl)** With customer1's token, post a second review of a restaurant they already reviewed: `curl -i -X POST http://localhost:3000/api/restaurants/1/reviews -H "Authorization: Bearer TOKEN" -H "Content-Type: application/json" -d '{"rating":5,"comment":"Second review"}'` | 409 "You have already reviewed this restaurant…" | |
| 4.11 | **(curl)** With **customer2's** token, edit review 1 (it belongs to customer1): `curl -i -X PUT http://localhost:3000/api/reviews/1 -H "Authorization: Bearer TOKEN" -H "Content-Type: application/json" -d '{"rating":1,"comment":"Not my review"}'` | 404 "Review not found." | |

## FR5: Owners add and update their restaurants (Orit)

| # | Steps | Expected result | ✓ |
|---|---|---|---|
| 5.1 | Log in as owner1 | My restaurants shows 4 cards with stars, review count and menu item count | |
| 5.2 | Click Add restaurant with an empty form | Errors under Name, Cuisine, Location and Price | |
| 5.3 | Type 501 characters in Description | The counter turns red at 501 / 500 | |
| 5.4 | Add a valid restaurant | "Your restaurant has been added." and a new card | |
| 5.5 | Click Edit on it | The form fills in, heading "Edit …", button "Save changes", Cancel edit appears | |
| 5.6 | Change the price and save | "Your restaurant has been updated."; the card shows the new price | |
| 5.7 | Click "View public page" | Its restaurant page with the new details; it also appears in search | |
| 5.8 | **(curl)** With owner1's token, update restaurant 5 (owner2's): `curl -i -X PUT http://localhost:3000/api/owner/restaurants/5 -H "Authorization: Bearer TOKEN" -H "Content-Type: application/json" -d '{"name":"Hacked","cuisine":"Seafood","location":"JLT","price_level":1}'` | 404 "Restaurant not found." | |

## FR6: Owners manage menu items (Aberham)

| # | Steps | Expected result | ✓ |
|---|---|---|---|
| 6.1 | As owner1, open Menu & reviews | The dropdown lists owner1's 4 restaurants; the table shows the first one's menu | |
| 6.2 | Choose another restaurant | Its menu and reviews load; the address shows `?restaurant=<id>` | |
| 6.3 | Add an item with price `0`, then `abc`, then `1.234` | "Price must be between 0.50 and 9999.99 AED." / "Price must be a number with at most 2 decimal places…" | |
| 6.4 | Add an item with price `12.50` | "Menu item added." and a new row | |
| 6.5 | Click Edit on it, change the price to `14`, Save (or press Enter) | "Menu item updated." | |
| 6.6 | Click Edit, then Cancel (or press Escape) | The row goes back unchanged | |
| 6.7 | Click Delete, then OK | "Menu item removed." | |
| 6.8 | Log in as a new owner with no restaurants and open Menu & reviews | "You don't have a restaurant yet." with a link to My restaurants | |
| 6.9 | **(curl)** With owner2's token, delete item 1 (owner1's): `curl -i -X DELETE http://localhost:3000/api/owner/menu/1 -H "Authorization: Bearer TOKEN"` | 404 "Menu item not found." | |

## FR7: Owners view their reviews (Aberham)

| # | Steps | Expected result | ✓ |
|---|---|---|---|
| 7.1 | As owner1, choose Karama Spice Box | "Reviews of this restaurant" shows its 4 reviews, newest first | |
| 7.2 | Choose Saffron Courtyard | "No reviews yet for this restaurant." | |
| 7.3 | **(curl)** With owner1's token: `curl -i http://localhost:3000/api/owner/restaurants/5/reviews -H "Authorization: Bearer TOKEN"` | 404 (restaurant 5 belongs to owner2) | |

## FR8: Admin manages accounts (Yassin Awny)

| # | Steps | Expected result | ✓ |
|---|---|---|---|
| 8.1 | Log in as admin | Counts at the top: 4 customers, 3 owners, 10 restaurants, 23 reviews | |
| 8.2 | Type `owner` in Search users; choose Role = Owners | The list filters as you type and by role | |
| 8.3 | On your own row | "You" tag; Delete is greyed out; Edit shows the role box disabled with "You cannot change your own role." | |
| 8.4 | Edit customer2 with email `bad` | "Enter a valid email address…" | |
| 8.5 | Edit customer2 with email customer1@sahaan.test | "Another account already uses this email." | |
| 8.6 | Change customer2's role to Owner, save | "User updated." Log in as customer2: the header now shows My restaurants | |
| 8.7 | Click Delete on owner3 | The confirm box warns that their 3 restaurants will be deleted too. Press Cancel | |
| 8.8 | Delete a customer you registered in 1.3 | "User deleted." and the counts go down | |
| 8.9 | **(curl)** With the admin's token, delete your own account (admin is user 1): `curl -i -X DELETE http://localhost:3000/api/admin/users/1 -H "Authorization: Bearer TOKEN"` | 400 "You cannot delete your own account." | |

## FR9: Admin manages restaurants (Yassin Awny)

| # | Steps | Expected result | ✓ |
|---|---|---|---|
| 9.1 | Restaurants tab: type `jlt` | Little Bosphorus Grill (search matches name, cuisine, location or owner) | |
| 9.2 | Edit a restaurant with name `C` | "Restaurant name must be 2 to 100 characters." | |
| 9.3 | Edit a restaurant's description and save | "Restaurant updated." and the public page shows the new text | |
| 9.4 | Delete a restaurant and confirm | "Restaurant deleted."; it is gone from search and the counts | |

## FR10: Admin removes reviews (Yassin Awny)

| # | Steps | Expected result | ✓ |
|---|---|---|---|
| 10.1 | Reviews tab: newest first | The rude 1-star review of Little Bosphorus Grill is near the top | |
| 10.2 | Type `clowns` in the search | Only the rude review | |
| 10.3 | Click Remove, then OK | "Review removed."; the restaurant's rating changes | |
| 10.4 | Search for `zzzz` | "No reviews match your search." | |

## NFR Security

| # | Steps | Expected result | ✓ |
|---|---|---|---|
| S.1 | **(curl)** No token: `curl -i http://localhost:3000/api/auth/me` | 401 `{"error":"Please log in first."}` | |
| S.2 | **(curl)** Customer token on admin: `curl -i http://localhost:3000/api/admin/users -H "Authorization: Bearer TOKEN"` | 403 `{"error":"You don't have access to this."}` | |
| S.3 | owner1 updating owner2's restaurant or menu item | 404 (see 5.8 and 6.9) | |
| S.4 | A customer editing someone else's review | 404 (see 4.11) | |
| S.5 | A second review of the same restaurant | 409 (see 4.10) | |
| S.6 | Bad input on each form (1.1, 1.2, 4.2, 5.2, 6.3, 8.4, 9.2) | The browser shows the error; with curl the server answers 400 with a message | |
| S.7 | Search for `' OR 1=1 --` | No error and no extra rows (see 2.10) | |
| S.8 | **(curl)** Register as admin: `curl -i -X POST http://localhost:3000/api/auth/register -H "Content-Type: application/json" -d '{"full_name":"Evil","email":"evil@sahaan.test","password":"Password1","role":"admin"}'` | 400 | |
| S.9 | As a customer, open `admin.html` and `owner.html` in the address bar | "You don't have access to this page" | |
| S.10 | Log out, open `profile.html` | Sent to the login page; after logging in you come back to the profile | |
| S.11 | Log in, stop the server, start it again, click Profile | Sent to the login page (sessions live in memory) | |
| S.12 | In MySQL Workbench or the mysql client: `SELECT email, password_hash FROM sahaan.users LIMIT 2;` | Hashes look like `a1b2…:9f8e…`, never the real password | |
| S.13 | **(curl)** `curl -i http://localhost:3000/api/nothing` | 404 `{"error":"API route not found."}` | |

## NFR Usability

| # | Steps | Expected result | ✓ |
|---|---|---|---|
| U.1 | Visit every page | The same header and footer on every page; the current page is highlighted | |
| U.2 | Open dev tools, phone size (375px wide), visit every page | No sideways scrolling of the page; cards in one column; tables scroll inside their box | |
| U.3 | At phone size, click Menu | The links open below the logo; click again to close | |
| U.4 | Submit every form once with good data and once with bad data | Every form shows a clear green success or red error message | |
| U.5 | Check the empty states (2.7, 3.4, 6.8, 7.2, 10.4, a new customer's My reviews) | Each one shows a friendly message, not a blank space | |
| U.6 | Use only the keyboard (Tab, Enter, arrow keys) on the home page, a review form and the admin tabs | A visible focus ring everywhere; stars and tabs work with the arrow keys | |

## NFR Reliability

| # | Steps | Expected result | ✓ |
|---|---|---|---|
| R.1 | For each form, send bad data with curl (bypassing the browser), e.g. `curl -i -X POST http://localhost:3000/api/auth/register -H "Content-Type: application/json" -d '{"full_name":"A","email":"x","password":"1","role":"customer"}'` | 400 with the same message the browser would show | |
| R.2 | **(curl)** Send broken JSON: `curl -i -X POST http://localhost:3000/api/auth/login -H "Content-Type: application/json" -d 'not json'` | 400 "The request body is not valid JSON." and the server keeps running | |
| R.3 | **(curl)** Bad ids: `curl -i http://localhost:3000/api/restaurants/abc` and `/api/restaurants/-1` | 400 "Restaurant id must be a positive whole number." | |
| R.4 | Stop MySQL, run `npm start` | A plain message ("Could not reach MySQL…"), not a crash dump. Start MySQL again afterwards | |
| R.5 | Run `npm run db:setup` twice in a row | Works both times and prints the demo accounts | |
