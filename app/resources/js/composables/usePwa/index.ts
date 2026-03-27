import { registerSW } from 'virtual:pwa-register'
import {
    installEvent,
    onlineAndConnected,
    refreshIntervalMs,
    showRefresh,
    swRegistration,
    updateSW,
} from './state'
import type { BeforeInstallPromptEvent } from './types'

const PERIODIC_SYNC_TAG = 'inertia-refresh:default'

let refreshFallbackTimerId: ReturnType<typeof setInterval> | undefined

function onBeforeInstallPrompt(event: BeforeInstallPromptEvent) {
    installEvent.value = event
}

// An event handler for when the user goes offline.
function onOffline() {
    onlineAndConnected.value = false
}

// An event handler for when the user goes online.
function onOnline() {
    getOnlineAndConnected()
}

// Verify if the browser is both online (has a network connection) and
// connected (the network connection works).
function getOnlineAndConnected() {
    fetch('/pwa/online-check', { cache: 'no-store' })
        .then((response) => {
            onlineAndConnected.value = navigator.onLine && response.status === 200
        })
        .catch(() => {
            onlineAndConnected.value = false
        })
}

function getMessageWorker() {
    return navigator.serviceWorker.controller ?? swRegistration.value?.active
}

function postRefreshExpired() {
    const worker = getMessageWorker()
    if (!worker) {
        return false
    }

    worker.postMessage({ type: 'REFRESH_EXPIRED' })
    return true
}

function startRefreshFallbackTimer() {
    if (refreshFallbackTimerId) {
        return
    }

    refreshFallbackTimerId = window.setInterval(() => {
        if (!navigator.onLine || !onlineAndConnected.value) {
            return
        }

        const posted = postRefreshExpired()
        if (!posted) {
            console.debug('[PWA] REFRESH_EXPIRED fallback skipped (no active worker)')
        }
    }, refreshIntervalMs)

    console.info(`[PWA] Using fallback refresh timer (${refreshIntervalMs}ms)`)
}

function registerPeriodicSync(registration: ServiceWorkerRegistration): boolean | Promise<boolean> {
    type PeriodicSyncCapableRegistration = ServiceWorkerRegistration & {
        periodicSync?: {
            register: (tag: string, options: { minInterval: number }) => Promise<void>
        }
    }

    const withPeriodicSync = registration as PeriodicSyncCapableRegistration
    if (!withPeriodicSync.periodicSync) {
        console.info('[PWA] Periodic sync not supported in this browser; fallback timer enabled')
        return false
    }

    return withPeriodicSync.periodicSync
        .register(PERIODIC_SYNC_TAG, {
            minInterval: refreshIntervalMs,
        })
        .then(() => {
            console.info(`[PWA] Periodic sync registered (${PERIODIC_SYNC_TAG}, ${refreshIntervalMs}ms)`)
            return true
        })
        .catch((error) => {
            console.warn('[PWA] Periodic sync registration failed; fallback timer enabled: ', error)
            return false
        })
}

function triggerSkipWaiting(registration: ServiceWorkerRegistration | undefined) {
    if (!registration?.waiting) {
        return
    }

    registration.waiting.postMessage({ type: 'SKIP_WAITING' })
}

export function usePwa() {
    function createPwa() {
        if (window.__PWA_INITIALIZED__) {
            console.log('[PWA] Already initialized');
            return
        }
        window.__PWA_INITIALIZED__ = true

        // PWA setup - capture the install event and put it in the store (when available)
        // for the UI to use it later to ask the user to install the app. Does not work
        // on every browser - e.g. won't work on Safari for Mac or iOS.
        window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt)

        // PWA setup - register the service worker and supply a callback if the
        // service worker detects that the app needs a refresh event. We can use this
        // to prompt the user to update rather than doing it automatically and
        // potentially losing their offline data.  The reload of the app resets
        // showRefresh back to false so we don't need to take care of that.
        const updateSWFn = registerSW({
            onRegisteredSW(swUrl, registration) {
                console.info(`[PWA] Service worker registration succeeded (${swUrl}): `, registration)
            },
            onRegisterError(error) {
                console.error('[PWA] Service worker registration failed: ', error)
            },
            onNeedRefresh() {
                if (window.__INERTIA_FORCED_RELOAD__) {
                    delete window.__INERTIA_FORCED_RELOAD__
                    triggerSkipWaiting(swRegistration.value)
                    return
                }

                showRefresh.value = true
            },
            onOfflineReady() {
                console.log('[PWA] Offline ready!')
            }
        })
        updateSW.value = updateSWFn

        // Online/offline - add event handlers to track when the user goes on and offline.
        window.addEventListener('offline', onOffline)
        window.addEventListener('online', onOnline)

        // Work out if the user is both online AND cannected
        getOnlineAndConnected()

        // Setup refresh triggers once the service worker is active.
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.ready
                .then((registration) => {
                    swRegistration.value = registration

                    const periodicSyncRegistration = registerPeriodicSync(registration)
                    if (typeof periodicSyncRegistration === 'boolean') {
                        if (!periodicSyncRegistration) {
                            startRefreshFallbackTimer()
                        }
                        return
                    }

                    return periodicSyncRegistration.then((periodicSyncRegistered) => {
                        if (!periodicSyncRegistered) {
                            startRefreshFallbackTimer()
                        }
                    })
                })
                .catch((error) => {
                    console.warn('[PWA] Failed to access service worker registration; fallback timer enabled:', error)
                    startRefreshFallbackTimer()
                })

            // kick off the first refresh check sooner so that we don't have to wait for the first interval to elapse
            setTimeout(() => {
                // check if we're online
                if (!navigator.onLine || !onlineAndConnected.value) {
                    return
                }

                // check if a service worker update is pending
                if (swRegistration.value?.waiting) {
                    // don't do it now, hopefully the user will update first and then we'll make it back here
                    return;
                }

                // post the REFRESH_EXPIRED message to the service worker
                const posted = postRefreshExpired()
                if (!posted) {
                    console.debug('[PWA] Initial REFRESH_EXPIRED fallback skipped (no active worker)')
                }
            }, 10000) // 10s
        }
    }

    return { createPwa, updateSW, installEvent, showRefresh, onlineAndConnected }
}