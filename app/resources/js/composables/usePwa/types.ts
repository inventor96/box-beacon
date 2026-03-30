// Types taken from https://stackoverflow.com/a/67171375/3861550

declare global {
    interface Window {
        __PWA_INITIALIZED__?: boolean
    }

    interface WindowEventMap {
        beforeinstallprompt: BeforeInstallPromptEvent
    }
}

interface BeforeInstallPromptEvent extends Event {
    readonly platforms: string[]
    readonly userChoice: Promise<{
        outcome: 'accepted' | 'dismissed'
        platform: string
    }>
    prompt(): Promise<void>
}

interface UsePwaOptions {
    refreshIntervalMs?: number | null
    initialRefreshDelayMs?: number | null
    periodicSyncTag?: string
}

export type { BeforeInstallPromptEvent, UsePwaOptions }