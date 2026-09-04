const $ = (id) => document.getElementById(id);
const state = { mode: 'random', current: null, saved: JSON.parse(localStorage.getItem('fuel-mode-saved') || '[]'), pantry: JSON.parse(localStorage.getItem('fuel-mode-pantry') || '[]'), selectedPantry: JSON.parse(localStorage.getItem('fuel-mode-selected-pantry') || 'null') };
state.selectedPantry = state.selectedPantry || [...state.pantry];

const recipes = [
  {name:'Cocoa Banana Power Oats', meals:['breakfast','snack'], diets:['any','highProtein','vegetarian','glutenFree'], goals:['pre','maintenance'], art:'🥣', description:'Fast-digesting carbs and a protein lift, built to get you moving without feeling heavy.', ingredients:['½ cup rolled oats','1 ripe banana','¾ cup milk of choice','1 tbsp cocoa powder','1 scoop vanilla protein','1 tbsp peanut butter'], steps:['Blend oats, banana, milk, cocoa and protein until smooth.','Pour into a bowl or jar and swirl in peanut butter.','Top with banana slices and eat 45–90 minutes before training.'], macros:['490 kcal','35g protein','64g carbs','13g fat'], time:'5 min'},
  {name:'Crisp Tofu Recovery Bowl', meals:['lunch','dinner'], diets:['any','vegan','vegetarian','highProtein','glutenFree'], goals:['recovery','maintenance'], art:'🥗', description:'Golden tofu, bright greens and plenty of carbs to restore what your workout spent.', ingredients:['200g firm tofu','1 cup cooked rice','2 cups spinach','½ avocado','1 tbsp tamari','Lime and sesame seeds'], steps:['Pat tofu dry, cube it and crisp in a hot pan with tamari.','Warm rice and wilt spinach with a splash of water.','Layer everything in a bowl; finish with avocado, lime and sesame.'], macros:['620 kcal','31g protein','74g carbs','24g fat'], time:'18 min'},
  {name:'Lemon Herb Chicken Plate', meals:['lunch','dinner'], diets:['any','highProtein','glutenFree'], goals:['recovery','maintenance'], art:'🍗', description:'A clean, satisfying protein-forward plate with enough color to make recovery feel easy.', ingredients:['160g chicken breast','1 cup cooked quinoa','1 cup broccoli','½ lemon','1 tsp olive oil','Fresh herbs'], steps:['Season chicken with lemon, herbs, salt and pepper; pan-sear until cooked through.','Steam broccoli while the chicken rests.','Serve over quinoa with olive oil and a final squeeze of lemon.'], macros:['590 kcal','52g protein','55g carbs','17g fat'], time:'25 min'},
  {name:'Berry Blast Yogurt Jar', meals:['breakfast','snack'], diets:['any','highProtein','vegetarian','glutenFree'], goals:['pre','recovery','maintenance'], art:'🫐', description:'Creamy, cool and protein-packed—with a berry pop and quick energy for your day.', ingredients:['1 cup Greek yogurt','½ cup mixed berries','¼ cup granola','1 tsp honey','1 tbsp chia seeds','Pinch of cinnamon'], steps:['Stir cinnamon and honey through the yogurt.','Layer yogurt, berries and granola in a jar.','Finish with chia seeds. Eat now or chill overnight.'], macros:['410 kcal','29g protein','52g carbs','10g fat'], time:'4 min'},
  {name:'Smoky Sweet Potato Tacos', meals:['lunch','dinner'], diets:['any','vegan','vegetarian','glutenFree'], goals:['pre','maintenance'], art:'🌮', description:'Big flavor, steady energy and zero fuss—a plant-powered meal that earns a repeat.', ingredients:['1 medium sweet potato','½ cup black beans','2 corn tortillas','¼ avocado','Smoked paprika','Salsa and lime'], steps:['Cube sweet potato, season with paprika and roast until tender.','Warm beans with a splash of water and warm tortillas.','Fill tortillas with beans, potato, avocado, salsa and lime.'], macros:['510 kcal','17g protein','82g carbs','14g fat'], time:'28 min'},
  {name:'Green Protein Smoothie', meals:['breakfast','snack'], diets:['any','highProtein','vegan','vegetarian','glutenFree'], goals:['pre','recovery'], art:'🥤', description:'A light, refreshing reset that gets protein and greens on board in minutes.', ingredients:['1 frozen banana','1 scoop protein powder','1 cup spinach','1 tbsp almond butter','1 cup oat milk','Ice'], steps:['Add all ingredients to a blender.','Blend until velvety smooth, adding a splash more milk if needed.','Pour, sip, and get after it.'], macros:['430 kcal','32g protein','49g carbs','13g fat'], time:'3 min'}
];

const cuisineProfiles = {
  any: { label: 'balanced', seasoning: 'salt, pepper and your favorite seasoning' },
  american: { label: 'American-inspired', seasoning: 'smoked paprika, garlic powder and lemon' },
  mexican: { label: 'Mexican-inspired', seasoning: 'cumin, smoked paprika and lime' },
  italian: { label: 'Italian-inspired', seasoning: 'oregano, garlic and basil' },
  chinese: { label: 'Chinese-inspired', seasoning: 'ginger, garlic and tamari' },
  westAfrican: { label: 'West African-inspired', seasoning: 'ginger, garlic and smoked paprika' }
};
const recipeCuisines = ['american','chinese','italian','american','mexican','american'];
recipes.forEach((recipe, index) => recipe.cuisines = [recipeCuisines[index]]);
recipes.push({name:'West African-Inspired Chickpea Stew', meals:['lunch','dinner'], diets:['any','vegan','vegetarian','glutenFree','highProtein'], goals:['recovery','maintenance'], cuisines:['westAfrican'], art:'🍲', description:'A warming tomato and chickpea stew with a ginger-forward, West African-inspired flavor direction.', ingredients:['1 can chickpeas, drained','1 cup crushed tomatoes','1 cup spinach','½ cup cooked rice','1 tsp olive oil','Ginger, garlic and smoked paprika'], steps:['Warm olive oil in a pan and cook ginger, garlic and smoked paprika for 30 seconds.','Add tomatoes and chickpeas; simmer for 8–10 minutes until thickened.','Fold in spinach until wilted, then serve over warm rice.'], macros:['540 kcal','22g protein','82g carbs','14g fat'], time:'18 min'});

function titleCase(value) { return value.replace(/\b\w/g, letter => letter.toUpperCase()); }
function makePantryRecipe(items) {
  const pantry = [...new Set(items.map(item => item.trim().toLowerCase()).filter(Boolean))].slice(0, 5);
  const diet = $('diet').value, goal = $('goal').value, meal = $('meal').value, cuisine = $('cuisine').value;
  const flavor = cuisineProfiles[cuisine];
  if (pantry.length < 2) return { error: 'Choose at least two ingredients so Fuel Mode can build a complete, useful meal.' };
  const has = (words, item) => words.some(word => item.includes(word));
  const animal = ['chicken','turkey','beef','steak','pork','salmon','tuna','fish','shrimp','prawn','egg','yogurt','milk','cheese'];
  const meat = ['chicken','turkey','beef','steak','pork','salmon','tuna','fish','shrimp','prawn'];
  const gluten = ['bread','pasta','barley','couscous','flour','wheat'];
  const conflicts = pantry.filter(item => (diet === 'vegan' && has(animal,item)) || (diet === 'vegetarian' && has(meat,item)) || (diet === 'glutenFree' && has(gluten,item)));
  if (conflicts.length) return { error: `${titleCase(conflicts.join(', '))} conflicts with your ${$('diet').options[$('diet').selectedIndex].text.toLowerCase()} setting. Deselect it or change your preference.` };
  const proteinWords = ['chicken','turkey','beef','steak','salmon','tuna','tofu','tempeh','eggs','egg','beans','lentils','yogurt','protein powder','shrimp'];
  const carbWords = ['rice','quinoa','pasta','potato','oats','bread','tortilla','noodles','couscous'];
  const vegWords = ['spinach','broccoli','pepper','tomato','onion','mushroom','zucchini','kale','carrot','greens'];
  const coldWords = ['yogurt','banana','berries','berry','milk','protein powder','granola','peanut butter','chia','oats'];
  const protein = pantry.find(item => has(proteinWords,item));
  const carb = pantry.find(item => has(carbWords,item));
  const vegetable = pantry.find(item => has(vegWords,item));
  const main = pantry.map(titleCase).join(', ');
  const list = (items) => items.length < 2 ? items[0] : items.length === 2 ? `${items[0]} and ${items[1]}` : `${items.slice(0, -1).join(', ')}, and ${items.at(-1)}`;
  const sidePreparation = (items) => {
    if (!items.length) return null;
    const bread = items.filter(item => has(['bread'], item));
    const grains = items.filter(item => has(['rice','quinoa','pasta','noodles','potato'], item));
    const vegetables = items.filter(item => has(vegWords, item));
    const extras = items.filter(item => !bread.includes(item) && !grains.includes(item) && !vegetables.includes(item));
    const steps = [];
    if (bread.length) steps.push(`toast ${list(bread)}`);
    if (grains.length) steps.push(`warm ${list(grains)}`);
    if (vegetables.length) steps.push(`quickly sauté ${list(vegetables)} until just tender`);
    if (extras.length) steps.push(`fold in ${list(extras)} at the end`);
    return `To use every selected ingredient, ${steps.join('; ')}.`;
  };
  const displayIngredient = (item) => {
    if (/^\d/.test(item)) return item;
    if (has(['egg'], item)) return '2 large eggs';
    if (has(['bread'], item)) return '2 slices bread';
    if (has(['rice','quinoa','pasta','noodles'], item)) return `1 cup cooked ${item}`;
    if (has(['spinach','broccoli','kale','mushroom','pepper','tomato','onion','zucchini','carrot'], item)) return `1 cup ${item}`;
    return titleCase(item);
  };
  const macroByGoal = { pre:['~500 kcal','~25g protein','~75g carbs','~12g fat'], recovery:['~600 kcal','~40g protein','~70g carbs','~18g fat'], maintenance:['~550 kcal','~32g protein','~60g carbs','~18g fat'] };
  const macros = diet === 'highProtein' ? [macroByGoal[goal][0],'~45g protein',macroByGoal[goal][2],macroByGoal[goal][3]] : macroByGoal[goal];
  const base = { pantryGenerated:true, meals:[meal], diets:[diet], goals:[goal], ingredients:[...pantry.map(displayIngredient)], macros, time:'15 min', description:`A ${$('goal').options[$('goal').selectedIndex].text.toLowerCase()} meal that puts your selected pantry ingredients first${cuisine === 'any' ? '.' : `, with a ${flavor.label} flavor direction.`}` };
  const coldMeal = pantry.length && pantry.every(item => has(coldWords,item));
  if (coldMeal) {
    const fruit = pantry.find(item => has(['banana','berries','berry'], item));
    const coldProtein = pantry.find(item => has(['yogurt','protein powder','milk'], item));
    const addIn = coldProtein ? null : diet === 'vegan' ? '½ cup plant-based yogurt' : '½ cup Greek yogurt';
    return {...base, name:`${pantry.slice(0,3).map(titleCase).join(' ')} Power Parfait`, art:'🥣', time:'5 min', ingredients:[...base.ingredients, ...(addIn ? [addIn] : []), 'Cinnamon (optional)'], steps:[fruit ? `Slice the ${fruit}. Add it to a bowl or jar with ${main}.` : `Add ${main} to a bowl or jar.`,has(['oats'], pantry.join(' ')) ? 'Stir until the oats are evenly coated; let the mixture stand for 3–5 minutes to soften the oats.' : 'Stir gently until the ingredients are evenly combined.',`Fold in any yogurt or nut butter${addIn ? `, adding the ${addIn} for creaminess` : ''}. Finish with cinnamon and eat straight away or chill for 10 minutes.`]};
  }
  if (has(['tortilla','wrap'], pantry.join(' '))) return {...base, name:`${pantry.slice(0,3).map(titleCase).join(' ')} Fuel Tacos`, art:'🌮', ingredients:[...base.ingredients,'1 tsp olive oil',flavor.seasoning], steps:[`Chop ${main} into bite-size pieces. Warm the tortillas in a dry skillet for 20–30 seconds per side, then wrap in a clean towel.`,`Heat olive oil in the skillet. Cook the firm ingredients first, then add softer vegetables or beans and season with ${flavor.seasoning}.`,`Divide the warm filling between tortillas. Finish with any fresh ingredients and serve straight away.`]};
  const steak = pantry.find(item => has(['steak'], item));
  if (steak) { const steakSides = pantry.filter(item => item !== steak && !has(['egg'], item)); return {...base, name:has(['egg','eggs'], pantry.join(' ')) ? 'Pan-Seared Steak & Eggs' : 'Pan-Seared Steak Plate', art:'🥩', macros:has(['egg','eggs'], pantry.join(' ')) ? ['~470 kcal','~52g protein','~2g carbs','~28g fat'] : ['~360 kcal','~46g protein','~0g carbs','~20g fat'], time:'18 min', ingredients:[...base.ingredients,'1 tsp neutral oil',flavor.seasoning], steps:[`Pat the ${steak} dry and season both sides with ${flavor.seasoning}. Heat a heavy skillet over medium-high until hot, then add the oil.`,`Sear the steak without moving it for 3–4 minutes per side for medium-rare, depending on thickness. Transfer it to a plate and rest for 5 minutes; it should reach 130–135°F (54–57°C) in the center.`,has(['egg','eggs'], pantry.join(' ')) ? 'Lower the heat to medium. Cook the eggs in the same skillet to your liking, then slice the steak across the grain and serve alongside the eggs.' : 'Slice the steak across the grain and serve immediately.', ...(sidePreparation(steakSides) ? [sidePreparation(steakSides)] : []) ]}; }
  if (meal === 'breakfast' && has(['egg','eggs'], pantry.join(' '))) {
    const bread = pantry.find(item => has(['bread'], item));
    if (bread) { const toastSides = pantry.filter(item => !has(['egg','bread'], item)); return {...base, name:'Soft Egg Toast', art:'🍳', macros:['~345 kcal','~18g protein','~31g carbs','~16g fat'], time:'8 min', ingredients:[...base.ingredients,'1 tsp olive oil',flavor.seasoning], steps:[`Toast the ${bread} until crisp at the edges but still tender in the center.`,`Crack the eggs into a bowl, add a pinch of salt, and beat with a fork until the yolks and whites are fully combined.`,`Warm olive oil in a non-stick skillet over low heat. Add the eggs and stir slowly with a spatula until softly set, then season with ${flavor.seasoning} and spoon over the toast.`, ...(sidePreparation(toastSides) ? [sidePreparation(toastSides)] : [])]}; }
    const vegetableText = vegetable ? `Finely chop the ${vegetable}. Warm olive oil in a non-stick skillet over medium heat and cook it until just tender.` : 'Warm olive oil in a non-stick skillet over low heat.';
    return {...base, name: vegetable ? `${titleCase(vegetable)} Soft Egg Scramble` : 'Soft Egg Scramble', art:'🍳', macros:['~190 kcal','~13g protein','~2g carbs','~14g fat'], time:'7 min', ingredients:[...base.ingredients,'1 tsp olive oil',flavor.seasoning], steps:[`Crack the eggs into a bowl, add a pinch of salt, and beat with a fork until smooth.`,vegetableText,`Pour in the eggs and stir slowly with a spatula until softly set. Take the pan off the heat, season with ${flavor.seasoning}, and serve at once.`]};
  }
  const proteinStep = protein && has(['chicken','turkey','beef','salmon','shrimp'], protein) ? `Cook ${protein} in a skillet over medium-high heat until fully cooked through; set it aside to rest.` : protein ? `Heat olive oil in a skillet over medium heat and cook ${protein} until hot and lightly browned.` : `Heat olive oil in a skillet over medium heat and cook the firm ingredients until tender.`;
  const remaining = pantry.filter(item => item !== protein);
  if (!protein && !carb && !vegetable) return { error: 'That combination does not yet fit a reliable recipe template. Add a protein, grain, or vegetable so Fuel Mode can make a sensible meal.' };
  return {...base, name:`${pantry.slice(0,3).map(titleCase).join(' ')} Training Bowl`, art:'🍲', ingredients:[...base.ingredients, ...(protein ? [] : [diet === 'vegan' ? '½ cup beans or lentils' : '2 eggs or ½ cup beans']), ...(carb ? [] : ['1 cup cooked rice or quinoa']), '1 tbsp olive oil',flavor.seasoning], steps:[`Prep every selected ingredient: ${main}. Chop vegetables, drain canned ingredients, and warm any cooked grains. Season with ${flavor.seasoning}.`,proteinStep,`Add ${list(remaining)} to the pan. Toss for 1–2 minutes until hot, taste for seasoning, and serve in a bowl.`]};
}
function compatible(recipe, goal, diet, meal, cuisine) { return recipe.goals.includes(goal) && recipe.meals.includes(meal) && (diet === 'any' || recipe.diets.includes(diet)) && (cuisine === 'any' || recipe.cuisines.includes(cuisine)); }
function recipeForSettings() {
  const goal = $('goal').value, diet = $('diet').value, meal = $('meal').value, cuisine = $('cuisine').value;
  let pool = recipes.filter(r => compatible(r, goal, diet, meal, cuisine));
  if (!pool.length) return { error: 'No vetted recipe matches every choice yet. Try another cuisine or meal type—Fuel Mode will not quietly ignore your preference.' };
  const notCurrent = pool.filter(r => !state.current || r.name !== state.current.name);
  return (notCurrent.length ? notCurrent : pool)[Math.floor(Math.random() * (notCurrent.length ? notCurrent.length : pool.length))];
}
function capitalize(value) { return value.replace(/([A-Z])/g, ' $1').replace(/^./, c => c.toUpperCase()); }
function renderRecipe(recipe) {
  const typedPantry = $('pantry').value.split(',').map(x => x.trim()).filter(Boolean);
  const pantry = state.mode === 'pantry' ? state.selectedPantry : typedPantry;
  state.current = recipe;
  $('emptyState').classList.add('is-hidden'); $('recipeCard').classList.remove('is-hidden');
  $('recipeName').textContent = recipe.name; $('recipeDescription').textContent = recipe.description;
  $('mealArt').textContent = recipe.art; $('visualMeal').textContent = $('meal').value.toUpperCase();
  $('goalTag').textContent = $('goal').options[$('goal').selectedIndex].text.toUpperCase();
  $('recipeNumber').textContent = String(Math.floor(Math.random()*89)+10);
  $('macros').innerHTML = recipe.macros.map((m,i) => { const [value,...rest] = m.split(' '); return `<div class="macro"><b>${value}</b><span>${rest.join(' ').toUpperCase()}</span></div>` }).join('');
  const prioritized = recipe.pantryGenerated ? recipe.ingredients : state.mode === 'pantry' && pantry.length ? [...pantry.slice(0,3), ...recipe.ingredients].filter((v,i,a)=>a.indexOf(v)===i).slice(0,6) : recipe.ingredients;
  $('ingredients').innerHTML = prioritized.map(x => `<li>${x}</li>`).join('');
  $('instructions').innerHTML = recipe.steps.map(x => `<li>${x}</li>`).join('');
  $('cookTime').textContent = recipe.time;
  $('pantryNote').textContent = state.mode === 'pantry' && pantry.length ? `Uses all ${pantry.length} selected ingredient${pantry.length === 1 ? '' : 's'} · estimates based on standard portions` : `Vetted match for ${capitalize($('goal').value)} · ${$('cuisine').options[$('cuisine').selectedIndex].text}`;
  $('saveRecipe').classList.toggle('saved', state.saved.some(r => r.name === recipe.name));
  $('saveRecipe').textContent = state.saved.some(r => r.name === recipe.name) ? '♥' : '♡';
  $('resultArea').scrollIntoView({behavior:'smooth',block:'start'});
}
function renderSaved() { $('savedCount').textContent = state.saved.length; $('savedList').innerHTML = state.saved.length ? state.saved.map(r => `<div class="saved-item"><div class="saved-item-art">${r.art}</div><div><strong>${r.name}</strong><span>${r.goal} · ${r.meal}</span></div></div>`).join('') : '<p class="drawer-empty">Nothing saved yet.<br />Keep the good ones close.</p>'; }
function persistPantry() { localStorage.setItem('fuel-mode-pantry', JSON.stringify(state.pantry)); localStorage.setItem('fuel-mode-selected-pantry', JSON.stringify(state.selectedPantry)); }
function renderPantry() { $('savedPantry').classList.toggle('is-hidden', !state.pantry.length); $('selectionCount').textContent = `${state.selectedPantry.length} selected`; $('pantryChips').innerHTML = state.pantry.map((item, index) => `<button type="button" class="pantry-chip ${state.selectedPantry.includes(item) ? 'selected' : ''}" data-index="${index}" aria-pressed="${state.selectedPantry.includes(item)}">${item}</button>`).join(''); document.querySelectorAll('.pantry-chip').forEach(chip => chip.addEventListener('click', () => { const item = state.pantry[Number(chip.dataset.index)]; state.selectedPantry = state.selectedPantry.includes(item) ? state.selectedPantry.filter(value => value !== item) : [...state.selectedPantry, item]; persistPantry(); renderPantry(); })); }
function toggleDrawer(open) { $('savedDrawer').classList.toggle('open',open); $('backdrop').classList.toggle('open',open); $('savedDrawer').setAttribute('aria-hidden',!open); }
document.querySelectorAll('.mode').forEach(button => button.addEventListener('click', () => { state.mode=button.dataset.mode; document.querySelectorAll('.mode').forEach(b=>{b.classList.toggle('active',b===button);b.setAttribute('aria-selected',b===button)}); $('pantryEntry').classList.toggle('is-hidden',state.mode !== 'pantry'); $('generateText').textContent = state.mode === 'pantry' ? 'Make pantry fuel' : 'Generate my fuel'; }));
$('generatorForm').addEventListener('submit', e => { e.preventDefault(); const typed = $('pantry').value.split(',').map(x => x.trim().toLowerCase()).filter(Boolean); if (state.mode === 'pantry' && typed.length) { state.pantry = [...new Set([...state.pantry, ...typed])]; state.selectedPantry = [...new Set([...state.selectedPantry, ...typed])]; $('pantry').value = ''; persistPantry(); renderPantry(); } if (state.mode === 'pantry') { if (!state.selectedPantry.length) { $('pantryStatus').textContent = 'Choose at least two ingredients to make pantry fuel.'; return; } const recipe = makePantryRecipe(state.selectedPantry); if (recipe.error) { $('pantryStatus').textContent = recipe.error; return; } renderRecipe(recipe); } else { const recipe = recipeForSettings(); if (recipe.error) { $('emptyState').textContent = recipe.error; $('emptyState').classList.remove('is-hidden'); return; } renderRecipe(recipe); } });
$('newRecipe').addEventListener('click',()=>{ if (state.mode !== 'pantry' || !state.selectedPantry.length) { const recipe = recipeForSettings(); if (recipe.error) { $('emptyState').textContent = recipe.error; $('emptyState').classList.remove('is-hidden'); return; } return renderRecipe(recipe); } const recipe = makePantryRecipe(state.selectedPantry); if (recipe.error) { $('pantryStatus').textContent = recipe.error; return; } renderRecipe(recipe); });
$('saveRecipe').addEventListener('click',()=>{if(!state.current)return;const exists=state.saved.findIndex(r=>r.name===state.current.name);if(exists>=0)state.saved.splice(exists,1);else state.saved.unshift({...state.current,goal:$('goal').options[$('goal').selectedIndex].text,meal:$('meal').value});localStorage.setItem('fuel-mode-saved',JSON.stringify(state.saved));renderSaved();renderRecipe(state.current);});
$('savedButton').addEventListener('click',()=>toggleDrawer(true)); $('closeDrawer').addEventListener('click',()=>toggleDrawer(false)); $('backdrop').addEventListener('click',()=>toggleDrawer(false)); renderSaved();
$('savePantry').addEventListener('click', () => { const items = $('pantry').value.split(',').map(x => x.trim().toLowerCase()).filter(Boolean); if (!items.length) { $('pantryStatus').textContent = 'Add a few ingredients first.'; return; } state.pantry = [...new Set([...state.pantry, ...items])]; state.selectedPantry = [...new Set([...state.selectedPantry, ...items])]; persistPantry(); $('pantry').value = ''; $('pantryStatus').textContent = `${items.length} ingredient${items.length === 1 ? '' : 's'} added and selected`; renderPantry(); });
$('clearSelected').addEventListener('click', () => { state.selectedPantry = []; persistPantry(); $('pantryStatus').textContent = 'Choose the ingredients you want to use.'; renderPantry(); });
$('clearPantry').addEventListener('click', () => { state.pantry = []; state.selectedPantry = []; localStorage.removeItem('fuel-mode-pantry'); localStorage.removeItem('fuel-mode-selected-pantry'); $('pantryStatus').textContent = 'Add ingredients, then choose what you want to cook with.'; renderPantry(); });
renderPantry();
