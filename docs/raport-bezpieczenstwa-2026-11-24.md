# Security Report

## Scan Information
- **Repository**: E-tutor (EduKwadrat)
- **Commit**: b6aa4da (fixes applied on top, released as 0.5.0)
- **Date**: 2026-11-24
- **Scans Included**: deps, secrets, code

---

## Executive Summary

EduKwadrat is a client-only learning app: a React single-page app with no server, no accounts and no network calls, packaged as a sideloaded Android APK and as a page on claude.ai. Its stored data is learning progress only. The attack surface is therefore small: typed answers, imported progress files, local storage, and the integrity of the Android package itself.

The scans found one high-severity issue and one low-severity issue, both in the Android project. The high finding is that the release signing key and its password were committed to the repository, which would let anyone with access to the repository or its history publish an APK that Android accepts as an update to the real app. Both issues have been fixed: signing material now comes from a git-ignored file or environment variables, a new 4096-bit key replaced the exposed one, the old key was removed from version control, and the file-sharing provider was narrowed to the single folder used for exports. No vulnerable dependencies were found (257 npm packages checked against OSV), and the code review found no injection sinks in the web app.

---

## Critical & High Findings

#### Android release signing key and password committed to the repository

- **Severity**: High
- **Location**: android/app/etutor-test.keystore (tracked since commit fce8973); android/app/build.gradle, signingConfigs.testKey
- **Secret Type**: Private key (code signing) and its password
- **Status**: Fixed in 0.5.0 (key rotated)

**Description**

Every APK from version 0.2.0 to 0.4.0 was signed with a key stored in the repository, with the keystore and key password written in plain text in the Gradle file. Android installs an APK as an update when the package name and signing certificate match, so anyone who could read the repository or its history could build a modified app that replaces the real one on students' phones. Because the APK is sideloaded, there is no store review in between. The code scan reported the same root cause as code-001 (CWE-798).

**Secret Details**

- Redacted Value: etu*****est (password); RSA 2048 private key in JKS
- Type: Code signing key
- Entropy: low (not detectable by entropy rules; found by manual review)

**Code Context**

```
signingConfigs {
    testKey {
        storeFile file('etutor-test.keystore')
        storePassword 'etu*****est'
        keyAlias 'etutor'
        keyPassword 'etu*****est'
    }
}
```

**Risk Assessment**

| Factor | Assessment |
|--------|-----------|
| Real Secret | Yes, it signed the distributed APKs |
| Hardcoded | Yes, keystore file and password literals |
| Production Code Path | Yes, used by the release build type |
| Exposure Evidence | Tracked in git and pushed to GitHub; present in history |

**Remediation (applied)**

1. Rotated: a new 4096-bit RSA key (PKCS12) with a 32-character random password signs 0.5.0. The old key is treated as compromised and no longer used.
2. Removed from source: `android/app/build.gradle` reads signing settings from `android/keystore.properties` (git-ignored, template in `keystore.properties.example`) or `EDUKWADRAT_KEYSTORE_*` environment variables. A release build without them stops with a clear message; debug builds still work.
3. `*.jks`, `*.keystore`, `keystore/` and `keystore.properties` are now git-ignored, and the old keystore is no longer tracked.
4. History: the old key remains in earlier commits. Rewriting history was not done because rotation makes the old key useless for signing future versions; rewrite it only if the repository is or becomes public.

```
// android/app/build.gradle (fixed)
def keystorePropsFile = rootProject.file('keystore.properties')
...
signingConfigs {
    release {
        if (releaseStoreFile) {
            storeFile rootProject.file(releaseStoreFile)
            storePassword signingValue('storePassword', 'EDUKWADRAT_KEYSTORE_PASSWORD')
            ...
```

**Verification**: Verified fixed. The 0.5.0 APK verifies with the new certificate (CN=EduKwadrat, SHA-256 6189d952...a0f0); a release build without the properties file fails as intended; a fresh secrets scan finds no committed key.

---

## Medium Findings

No medium severity findings were identified across all scans.

---

## Scan Coverage

| Scan Type | Status | Candidates Scanned | Confirmed Findings | False Positives Filtered |
|-----------|--------|--------------------|--------------------|--------------------------|
| Dependencies (SCA) | ran | 257 packages | 0 | 0 |
| Secrets | ran | 209 | 1 (manual review) | 209 |
| Code (SAST) | ran | 2 | 2 (1 high, 1 low, both fixed) | 0 |

### Methodology

- **Dependencies (SCA)**: wraith with osv-scanner 2.2.3 checked package-lock.json (257 npm packages) against the OSV database; npm audit agreed. Android Gradle dependencies have no lockfile and were not covered.
- **Secrets**: poltergeist scanned 13,507 files with its built-in rules; every candidate was in git-ignored third-party folders. A manual review of signing configuration found the committed key.
- **Code (SAST)**: balanced plan with five vectors per project. Web app: DOM XSS, prototype pollution, CSS injection, postMessage origin checks, source map exposure (no issues). Android: hardcoded secrets, backup exposure, WebView, exported components, debug flags (two issues, both fixed; backup accepted because data is non-sensitive and goes to the student's own account).

---

*Report generated by Ghost Security*
