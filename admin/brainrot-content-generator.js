/**
 * 🧠 Brainrot Content Generator
 * 
 * Generates 100 brainrot-themed username/description pairs
 * for assigning to uploaded reels
 */

const BRAINROT_USERNAMES = [
  'skibidi_sigma', 'ohio_rizz_lord', 'gyatt_master9000', 'fanum_tax_collector',
  'grimace_shake_survivor', 'mewing_mogger', 'caseoh_fanboy', 'ishowspeed_clone',
  'kai_cenat_enjoyer', 'jellybean_hater42', 'subway_surfer_addict', 'family_guy_clips',
  'ratio_god', 'sussy_imposter', 'griddy_dancer', 'ankha_zone_watcher',
  'backrooms_explorer', 'huggy_wuggy_simp', 'poppy_playtime_fan', 'garten_of_banban',
  'only_in_ohio', 'bro_really_said', 'nah_id_win', 'stand_proud_yuji',
  'gojo_satoru_kin', 'megumi_shikigami', 'twitter_warrior', 'tiktok_brainrot',
  'sigma_grindset', 'alpha_male_tips', 'patrick_bateman_fan', 'literally_me',
  'fight_club_tyler', 'american_psycho', 'blade_runner_2049', 'ryan_gosling_simp',
  'gigachad_wojak', 'soyjak_pointer', 'npc_energy', 'main_character_syndrome',
  'fortnite_battle_pass', 'among_us_in_real_life', 'minecraft_parkour', 'roblox_oof',
  'freddy_fazbear', 'five_nights_at', 'fnaf_lore_master', 'markiplier_screaming',
  'matpat_theory', 'game_theory_debunked', 'film_theory_watcher', 'food_theory_enjoyer',
  'vsauce_michael', 'hey_vsauce', 'moon_men_listener', 'spittin_chiclets',
  'bussin_fr_fr', 'no_cap_detected', 'sheesh_moment', 'caught_in_4k',
  'down_bad_horrendously', 'touch_grass_advisory', 'chronically_online', 'terminally_online',
  'discord_kitten', 'discord_mod_moment', 'reddit_moderator', 'reddit_admin_alt',
  '4chan_greentext', 'op_is_lying', 'fake_and_gay', 'real_and_straight',
  'based_department', 'cringe_compilation', 'try_not_to_cringe', 'you_laugh_you_lose',
  'ylyl_thread', 'coomer_moment', 'gooner_cave', 'morbius_sweep',
  'morbin_time', 'its_morbin_time', 'el_gato_meme', 'blahaj_owner',
  'programmer_socks', 'thigh_highs_unix', 'arch_linux_btw', 'i_use_arch',
  'vim_user_btw', 'emacs_supremacy', 'nano_enjoyer', 'vscode_normie',
  'jetbrains_fan', 'intellij_rider', 'dark_mode_only', 'light_mode_psycho',
  'comic_sans_coder', 'tabs_vs_spaces', 'semicolon_hater', 'python_indentation',
  'javascript_null', 'typescript_any', 'rust_evangelist', 'go_gopher_lover',
  'c_plusplus_hell', 'memory_leak_master', 'segfault_speedrun', 'stack_overflow_copy',
  'github_copilot_abuser', 'chatgpt_coder', 'ai_will_replace_us', 'prompt_engineer',
];

const BRAINROT_DESCRIPTIONS = [
  'POV: you got that skibidi rizz 💀',
  'bro really thought he could escape ohio 😭',
  'caught lacking in 4k ultra hd 📸',
  'this goes hard feel free to screenshot 🔥',
  'only in ohio bruh 💀',
  'nah bro got that fanum tax energy',
  'gyatt damn this is bussin fr fr no cap 🧢',
  'mewing tutorial (99% will fail) 😮',
  'sigma male grindset compilation #47',
  'griddy in the backrooms challenge ⚠️',
  'ishowspeed accidentally summons grimace 💜',
  'subway surfers but its existential dread',
  'family guy funny moments lobotomy edition',
  'ratio + L + fell off + cope + seethe',
  'among us in real life (sus edition) 📮',
  'minecraft parkour civilization lore',
  'when the imposter is sus (original mix)',
  'goofy ahh sounds that cured my depression',
  'watching this at 3am (gone wrong!!)',
  'do NOT search this at 3am challenge',
  'the voices are getting louder 🔊',
  'just a chill guy tbh 😎',
  'bro is NOT that guy 💀',
  'nah id win (he did not win)',
  'stand proud, you are strong (copium)',
  'throughout heaven and earth i alone am bussin',
  'domain expansion: infinite brainrot 🧠',
  'patrick bateman returns videotapes asmr',
  'literally me fr fr (not literally me)',
  'ryan gosling driving at night (1 hour)',
  'sigma male stare compilation',
  'giga chad theme song bass boosted',
  'breaking bad ozymandias scene explained',
  'better call saul main character syndrome',
  'bro thinks hes in an anime 😭',
  'fnaf lore explained in 30 seconds (impossible)',
  'matpat was right all along...',
  'game theory: is spongebob a war criminal?',
  'vsauce music plays menacingly',
  'caught you being cringe in 8k hdr',
  'most sane twitter user:',
  'least deranged reddit moderator',
  'discord mod final boss fight',
  '4chan discovers grass (rare footage)',
  'anon goes outside (fiction)',
  'mfw no gf (day 1847) 😔',
  'tfw no big tiddy goth gf',
  'touch grass simulator 2024',
  'chronically online behavior detected',
  'terminally online core aesthetic',
  'the duality of man (feat. brainrot)',
  'elder millennial tries to understand zoomer',
  'gen alpha final form unlocked',
  'gen z humor peaked in 2021',
  'morbin time compilation 3 hours',
  'its morbin time but its concerning',
  'morbius sweep never happened (copium)',
  'el gato is watching you sleep 👁️',
  'programming socks gave me +50 iq',
  'i use arch btw (nobody asked)',
  'vim user discovers :q (emotional)',
  'vscode user tries vim (ragequit)',
  'dark mode vs light mode warfare',
  'tabs vs spaces (the final battle)',
  'semicolon; syntax error on line 47',
  'python indentation error PTSD',
  'javascript == vs === (explained poorly)',
  'rust borrow checker roasts me (10 hours)',
  'c++ segmentation fault speedrun WR',
  'stack overflow copy paste tutorial',
  'github copilot writes malware again',
  'chatgpt learns what consciousness is',
  'ai generated brainrot (cursed)',
  'prompt engineering is not a real job',
  'nft bros down bad update',
  'web3 is dead long live web4',
  'metaverse meeting could have been an email',
  'elon musk tweets again (world ends)',
  'mark zuckerberg discovers human emotion',
  'jeff bezos space cowboy aesthetic',
  'silicon valley tech bro core',
  'startup that will definitely fail',
  'billion dollar idea (its an app)',
  'this will disrupt the industry trust',
  'we are like uber but for X',
  'the zoom call incident of 2024',
  'microsoft teams jumpscare warning',
  'corporate memphis art style horror',
  'linkedin lunatics compilation vol 4',
  'hustle culture cringe moments',
  'toxic positivity boss moment',
  'corporate speak translation guide',
  'synergy maximization thought leadership',
  'lets circle back on this (never circles back)',
  'ill ping you on slack (never pings)',
  'can you jump on a quick call (2 hour meeting)',
  'the spreadsheet has gained sentience',
  'excel formulas that make you cry',
  'monday morning standup (trauma)',
  'friday 4:55pm emergency meeting called',
  'pto request denied (villain origin story)',
  'unlimited pto (gets fired for using it)',
];

/**
 * Generate a random brainrot username/description pair
 */
function generateBrainrotContent() {
  const username = BRAINROT_USERNAMES[Math.floor(Math.random() * BRAINROT_USERNAMES.length)];
  const description = BRAINROT_DESCRIPTIONS[Math.floor(Math.random() * BRAINROT_DESCRIPTIONS.length)];
  
  return { username, description };
}

/**
 * Generate N unique pairs (tries to avoid duplicates)
 */
function generateUniquePairs(count = 100) {
  const pairs = [];
  const usedCombos = new Set();
  
  let attempts = 0;
  const maxAttempts = count * 10;
  
  while (pairs.length < count && attempts < maxAttempts) {
    const pair = generateBrainrotContent();
    const combo = `${pair.username}|${pair.description}`;
    
    if (!usedCombos.has(combo)) {
      usedCombos.add(combo);
      pairs.push(pair);
    }
    
    attempts++;
  }
  
  return pairs;
}

/**
 * Get a deterministic pair based on filename hash
 * (same filename always gets same username/description)
 */
function getPairForFilename(filename) {
  // Simple hash function
  let hash = 0;
  for (let i = 0; i < filename.length; i++) {
    const char = filename.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  // Use hash to deterministically select username and description
  const usernameIndex = Math.abs(hash) % BRAINROT_USERNAMES.length;
  const descriptionIndex = Math.abs(hash >> 16) % BRAINROT_DESCRIPTIONS.length;
  
  return {
    username: BRAINROT_USERNAMES[usernameIndex],
    description: BRAINROT_DESCRIPTIONS[descriptionIndex]
  };
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    BRAINROT_USERNAMES,
    BRAINROT_DESCRIPTIONS,
    generateBrainrotContent,
    generateUniquePairs,
    getPairForFilename
  };
}

// CLI usage: node brainrot-content-generator.js [count]
if (require.main === module) {
  const count = parseInt(process.argv[2]) || 10;
  const pairs = generateUniquePairs(count);
  
  console.log(`\n🧠 Generated ${pairs.length} Brainrot Username/Description Pairs:\n`);
  pairs.forEach((pair, i) => {
    console.log(`${i + 1}. @${pair.username}`);
    console.log(`   "${pair.description}"\n`);
  });
}

