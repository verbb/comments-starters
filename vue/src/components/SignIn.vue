<script setup lang="ts">
import { onMounted, ref } from 'vue';

import { getSession, signIn, signOut, type Session } from '../craft';

// The seeded people, all with the password "password".
const people = [
    { loginName: 'priya', label: 'Priya, a member' },
    // The seeded moderator only signs in locally. On a public demo, Craft refuses them.
    ...(import.meta.env.DEV ? [{ loginName: 'sam', label: 'Sam, a moderator' }] : []),
];

const session = ref<Session | null>(null);
const busy = ref(false);
const error = ref<string | null>(null);

onMounted(() => {
    getSession().then((value) => {
        session.value = value;
    }, () => {
        error.value = 'Couldn’t reach Craft.';
    });
});

async function run(task: () => Promise<void>) {
    busy.value = true;
    error.value = null;

    try {
        await task();
        session.value = await getSession();
    } catch (caught) {
        error.value = caught instanceof Error ? caught.message : 'Something went wrong.';
    } finally {
        busy.value = false;
    }
}
</script>

<template>
    <p v-if="!session && error" class="text-sm text-red-700">{{ error }}</p>
    <div v-else-if="session" class="flex flex-wrap items-center gap-2 text-sm">
        <template v-if="session.isGuest">
            <span class="text-slate-600">Reading as a guest. Sign in as</span>
            <button
                v-for="person in people"
                :key="person.loginName"
                type="button"
                :disabled="busy"
                class="rounded-lg border border-slate-300 bg-white px-3 py-1.5 font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-50"
                @click="run(() => signIn(person.loginName, 'password'))"
            >
                {{ person.label }}
            </button>
        </template>
        <template v-else>
            <span class="text-slate-600">Signed in as <strong class="text-slate-900">{{ session.username }}</strong></span>
            <button type="button" :disabled="busy" class="rounded-lg border border-slate-300 bg-white px-3 py-1.5 font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-50" @click="run(signOut)">
                Sign out
            </button>
        </template>
        <span v-if="error" role="alert" class="text-red-700">{{ error }}</span>
    </div>
</template>
