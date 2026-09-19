# My Investment Account

A static, child-friendly pretend investment tracker for GitHub Pages. A parent authorises one RM20 weekly deposit; the child chooses Gold, US Shares, or Asia Shares. Firebase Authentication and Firestore keep the portfolio synchronised across devices, while local storage keeps a usable offline copy.

## 1. Create the Firebase project

1. Create a new project at https://console.firebase.google.com/.
2. Open **Build → Authentication → Get started → Email/Password** and enable Email/Password.
3. In **Authentication → Users**, add one parent-controlled user. Do not add public registration to the app.
4. Open **Build → Firestore Database → Create database** and choose Production mode.
5. Open **Firestore → Rules**, replace the rules with `firestore.rules`, and publish them.
6. Open **Project settings → Your apps**, add a Web app, and copy its `firebaseConfig` values into `dist/firebase-config.js`.
7. Under **Authentication → Settings → Authorised domains**, add the GitHub Pages hostname if it is not already present (for example `username.github.io`).

The Firebase web configuration is an identifier, not a secret. Data security comes from Authentication and the included Firestore rules, which allow each signed-in user to read and write only `accounts/{their uid}`.

## 2. Test locally

From the project root:

```bash
python3 scripts/update_prices.py
python3 -m json.tool dist/prices.json >/dev/null
python3 -m http.server 8080 --directory dist
```

Open http://localhost:8080 and sign in with the user created in Firebase Console. Add `localhost` to Firebase Authentication's authorised domains if required.

Test synchronisation by opening the app in a second browser, signing in with the same parent account, and confirming that an investment made in one browser appears in the other.

## 3. GitHub Pages

Push the repository to a GitHub repository whose default branch is `main`. In **Settings → Pages**, select **GitHub Actions** as the source. The included deployment workflow publishes `dist`, and the price workflow refreshes GLDM, SPY, AIA and USD/MYR four times on weekdays before republishing the latest delayed snapshot.

## Storage behaviour

- Firestore is the authoritative cross-device account store.
- The browser retains a local copy for fast loading and temporary offline use.
- Changes made offline are retained locally and are uploaded after the user is signed in and connectivity returns.
- Parent Mode → Export backup remains available as a second recovery method.
- Signing out removes access to the cloud account but does not delete Firestore data.

## Important limits

- This is an educational simulation, not a brokerage account or financial advice.
- The parent PIN is a child-friendly control inside the shared account; Firebase sign-in protects access to the cloud data.
- Prices are delayed market snapshots, not tick-by-tick quotes.
