-- Seed: 25 Activities across all MVP categories and kinds (Section 6)

INSERT INTO public.activities (slug, title, description, kind, category, mode, duration_minutes, icon, config) VALUES
-- Would You Rather (Play)
('wyr-cozy-vs-wild', 'Cozy Night vs Wild Adventure', 'Discover each other''s spontaneous and comfort preferences with playful dilemmas.', 'would_you_rather', 'play', 'both', 10, 'sparkles', '{
  "rounds": [
    {"id": 1, "question": "Would you rather have a candlelit dinner at home or sneak into a fancy rooftop lounge?", "optionA": "Candlelit dinner at home", "optionB": "Sneak into a rooftop lounge"},
    {"id": 2, "question": "Would you rather wake up to homemade breakfast in bed or stay up until 4 AM talking under the stars?", "optionA": "Breakfast in bed", "optionB": "Late night stargazing"},
    {"id": 3, "question": "Would you rather take a sudden road trip with no destination or spend a weekend at a quiet cabin?", "optionA": "Spontaneous road trip", "optionB": "Quiet cabin retreat"},
    {"id": 4, "question": "Would you rather never have to cook again or never have to do dishes again?", "optionA": "Never cook", "optionB": "Never do dishes"},
    {"id": 5, "question": "Would you rather rewatch our favorite comfort show or start an exciting mystery together?", "optionA": "Comfort show rewatch", "optionB": "New mystery series"}
  ]
}'::jsonb),

('wyr-travel-dreams', 'Dream Vacations & Escapes', 'Explore your future travel bucket list and travel style choices.', 'would_you_rather', 'play', 'both', 10, 'airplane', '{
  "rounds": [
    {"id": 1, "question": "Would you rather backpack across Europe on a budget or stay in an overwater bungalow in the Maldives for 3 days?", "optionA": "Europe backpacking", "optionB": "Maldives bungalow"},
    {"id": 2, "question": "Would you rather get lost in a vibrant night market in Tokyo or hike the Swiss Alps?", "optionA": "Tokyo night markets", "optionB": "Swiss Alps hiking"},
    {"id": 3, "question": "Would you rather travel back in time to our first meeting or 20 years into our future?", "optionA": "Our first meeting", "optionB": "20 years into the future"},
    {"id": 4, "question": "Would you rather always have the window seat or always get free first-class upgrades for only one of us?", "optionA": "Guaranteed window seat", "optionB": "One first-class upgrade"},
    {"id": 5, "question": "Would you rather rent a vintage camper van or a beachfront glass villa?", "optionA": "Vintage camper van", "optionB": "Beachfront villa"}
  ]
}'::jsonb),

('wyr-quirky-habits', 'Quirks & Superpowers', 'Lighthearted questions about bizarre scenarios and habits.', 'would_you_rather', 'play', 'both', 8, 'smile', '{
  "rounds": [
    {"id": 1, "question": "Would you rather have a personal chef or a personal masseuse?", "optionA": "Personal chef", "optionB": "Personal masseuse"},
    {"id": 2, "question": "Would you rather be able to read my mind for 1 hour or have me read yours for 1 day?", "optionA": "Read my mind (1 hr)", "optionB": "Read yours (1 day)"},
    {"id": 3, "question": "Would you rather always have cold hands or always have warm feet?", "optionA": "Cold hands", "optionB": "Warm feet"},
    {"id": 4, "question": "Would you rather communicate only through emojis for 24 hours or in rhymes?", "optionA": "Emojis only", "optionB": "Rhymes only"}
  ]
}'::jsonb),

-- Who Knows Whom Better (Play)
('who-knows-daily-habits', 'Who Knows Whom Better: Daily Habits', 'Test how well you really observe each other''s everyday routines and secrets.', 'who_knows_whom', 'play', 'both', 12, 'heart', '{
  "rounds": [
    {"id": 1, "target": "partner_a", "prompt": "What is my absolute go-to comfort meal when I am stressed?", "type": "free_text"},
    {"id": 2, "target": "partner_b", "prompt": "What is the very first thing I do after turning off my morning alarm?", "type": "free_text"},
    {"id": 3, "target": "partner_a", "prompt": "What is my biggest pet peeve when traveling or running errands?", "type": "free_text"},
    {"id": 4, "target": "partner_b", "prompt": "Which song or artist instantly puts me in a great mood?", "type": "free_text"},
    {"id": 5, "target": "both", "prompt": "Who is usually the first person to apologize after a disagreement?", "type": "choice", "options": ["Partner A", "Partner B", "Equal"]}
  ]
}'::jsonb),

('who-knows-childhood-memories', 'Childhood & Growing Up', 'Discover sweet stories and see how much of your early years your partner remembers.', 'who_knows_whom', 'play', 'both', 12, 'book', '{
  "rounds": [
    {"id": 1, "target": "partner_a", "prompt": "What did I want to be when I grew up as a kid?", "type": "free_text"},
    {"id": 2, "target": "partner_b", "prompt": "What was the name of my first pet or favorite childhood toy?", "type": "free_text"},
    {"id": 3, "target": "partner_a", "prompt": "Was I an introverted or extroverted child?", "type": "choice", "options": ["Introverted", "Extroverted", "A bit of both"]},
    {"id": 4, "target": "partner_b", "prompt": "What was my least favorite school subject?", "type": "free_text"}
  ]
}'::jsonb),

-- Guess My Answer (Play)
('guess-my-favorite-things', 'Guess My Absolute Favorites', 'Can you guess what your partner would pick from these categories?', 'guess_my_answer', 'play', 'both', 10, 'help-circle', '{
  "rounds": [
    {"id": 1, "question": "If I could only eat one cuisine for the rest of my life, which would I pick?", "options": ["Italian", "Mexican", "Japanese / Sushi", "Indian", "Thai", "Burgers & BBQ"]},
    {"id": 2, "question": "What is my ideal Sunday morning vibe?", "options": ["Sleeping in till noon", "Coffee & a quiet book", "Brisk morning run/gym", "Brunch with good music", "Binging a series in bed"]},
    {"id": 3, "question": "What movie genre would I pick for movie night?", "options": ["Romantic Comedy", "Psychological Thriller", "Sci-Fi / Fantasy", "Action / Adventure", "True Crime Documentary"]},
    {"id": 4, "question": "If I won $10,000 today, what would I spend the majority of it on?", "options": ["Flights to see you", "Savings / Investing", "Dream shopping spree", "A luxury gadget/upgrade", "Fancy restaurant celebration"]}
  ]
}'::jsonb),

('guess-my-secret-wishes', 'Secret Wishes & Desires', 'Guess what your partner is longing for right now.', 'guess_my_answer', 'play', 'both', 10, 'sparkles', '{
  "rounds": [
    {"id": 1, "question": "What is the #1 thing I miss most about having you right next to me right now?", "options": ["Your hugs and warmth", "Cooking together in the kitchen", "Laughing at silly jokes in person", "Falling asleep next to you", "Exploring places hand-in-hand"]},
    {"id": 2, "question": "Where is the first place we should go the day we reunite?", "options": ["Straight home for cuddles", "Our favorite restaurant", "A walk in the park", "A weekend getaway road trip"]},
    {"id": 3, "question": "What is a new hobby I would love to try together with you?", "options": ["Pottery / Painting", "Cooking class", "Scuba diving / Snorkeling", "Rock climbing", "Dance lessons"]}
  ]
}'::jsonb),

-- Drawing & Guessing (Play)
('drawing-classic-love', 'Doodle & Guess: Love Edition', 'Draw a prompt and let your partner guess what you sketched!', 'drawing_guess', 'play', 'live', 15, 'edit-3', '{
  "rounds": [
    {"id": 1, "drawer": "partner_a", "prompt": "Airplane flying across the globe"},
    {"id": 2, "drawer": "partner_b", "prompt": "Two coffee cups touching"},
    {"id": 3, "drawer": "partner_a", "prompt": "Heart-shaped pizza"},
    {"id": 4, "drawer": "partner_b", "prompt": "Couple watching sunset on a beach"}
  ]
}'::jsonb),

('drawing-silly-animals', 'Doodle & Guess: Silly Animals', 'Fast-paced, funny animal sketching challenge.', 'drawing_guess', 'play', 'live', 12, 'edit-2', '{
  "rounds": [
    {"id": 1, "drawer": "partner_a", "prompt": "Penguin wearing sunglasses"},
    {"id": 2, "drawer": "partner_b", "prompt": "Cat eating spaghetti"},
    {"id": 3, "drawer": "partner_a", "prompt": "Giraffe doing yoga"},
    {"id": 4, "drawer": "partner_b", "prompt": "Panda riding a bicycle"}
  ]
}'::jsonb),

-- Quizzes (Play & Deep Talk)
('quiz-love-languages', 'The 5 Love Languages Quiz', 'Understand each other''s primary and secondary ways of giving and receiving love.', 'quiz', 'deep_talk', 'both', 15, 'heart', '{
  "rounds": [
    {"id": 1, "question": "Which of these makes you feel most cherished?", "options": ["Hearing sincere verbal compliments and ''I love you''", "Receiving a thoughtful surprise gift", "Spending uninterrupted focused time together", "Having your partner help lighten your daily load", "Physical touch like a warm long hug"]},
    {"id": 2, "question": "When we are apart long-distance, what matters most to your heart?", "options": ["Surprise handwritten letters or voice notes", "Consistent scheduled quality call dates", "Cheering each other up through tough tasks", "Small care packages in the mail", "Reminding each other of our future together"]},
    {"id": 3, "question": "How do you most naturally show love when you care deeply?", "options": ["Words of encouragement", "Giving gifts & surprises", "Planning special experiences", "Doing thoughtful acts of service", "Affection and closeness"]}
  ]
}'::jsonb),

('quiz-our-relationship-milestones', 'Our Relationship Milestones Trivia', 'How accurately do you remember the exact moments of our journey?', 'quiz', 'play', 'both', 10, 'clock', '{
  "rounds": [
    {"id": 1, "question": "What month and day was our very first official date or conversation?", "type": "free_text"},
    {"id": 2, "question": "Who said ''I love you'' first, or was it simultaneous?", "type": "choice", "options": ["Partner A", "Partner B", "Both together"]},
    {"id": 3, "question": "What is our all-time favorite inside joke or nickname?", "type": "free_text"},
    {"id": 4, "question": "What was the very first meal or treat we ever shared together?", "type": "free_text"}
  ]
}'::jsonb),

-- Photo Missions (Async Challenges)
('photo-mission-daily-view', 'Daily View Mission', 'Snap a photo of the view from your window or current workspace right now.', 'photo_mission', 'play', 'async', 5, 'camera', '{
  "prompt": "Take a photo of whatever is in front of your eyes right this second—no cleaning up or staging allowed!",
  "instructions": "Upload a candid shot showing what your day looks like right now.",
  "rewardMessage": "You brought your partner right into your room today!"
}'::jsonb),

('photo-mission-something-that-reminds-me', 'Something That Reminds Me of You', 'Find an object around you that instantly makes you think of your partner.', 'photo_mission', 'play', 'async', 8, 'camera', '{
  "prompt": "Find something in your room or around your city that whispers their name.",
  "instructions": "Take a photo and add a sweet note explaining why it reminds you of them.",
  "rewardMessage": "Shared a piece of your heart across the distance."
}'::jsonb),

('photo-mission-cozy-mug', 'Morning Drink & Cozy Moment', 'Snap your morning coffee, tea, or water mug.', 'photo_mission', 'play', 'async', 5, 'coffee', '{
  "prompt": "Show your morning brew and where you are sipping it from.",
  "instructions": "Snap your mug and send your morning love.",
  "rewardMessage": "Cheers to another day closer to each other."
}'::jsonb),

-- Guided Virtual Dates (Dates Tab)
('guided-date-candlelit-dinner', 'Virtual Candlelight Dinner', 'Turn an ordinary dinner into an intimate, romantic virtual date with timed courses and talk cards.', 'guided_date', 'dates', 'live', 45, 'moon', '{
  "steps": [
    {"id": "step1", "title": "Date Preparation", "duration_minutes": 5, "prompt": "Set your table, dim the lights, light a candle if you have one, and grab your favorite meal and drink.", "description": "Set your table, dim the lights, light a candle if you have one, and grab your favorite meal and drink.", "checklist": ["Table set and cleared", "Candle or warm light on", "Favorite meal & drink ready"]},
    {"id": "step2", "title": "The Toast", "duration_minutes": 5, "prompt": "Raise your glasses together. Share one thing about your partner that you felt deeply grateful for this past week.", "description": "Raise your glasses together. Share one thing about your partner that you felt deeply grateful for this past week.", "checklist": ["Glasses raised together", "Gratitude shared"]},
    {"id": "step3", "title": "Main Course & Deep Conversation", "duration_minutes": 25, "prompt": "Enjoy your dinner together while answering these prompts: What made you smile today? What is something new you learned about yourself recently?", "description": "Enjoy your dinner together while answering these prompts: What made you smile today? What is something new you learned about yourself recently?"},
    {"id": "step4", "title": "Dessert & Sweet Wishes", "duration_minutes": 10, "prompt": "Enjoy a sweet treat or warm tea. Share one dream date you cannot wait to take your partner on when you next reunite.", "description": "Enjoy a sweet treat or warm tea. Share one dream date you cannot wait to take your partner on when you next reunite."}
  ]
}'::jsonb),

('guided-date-movie-night', 'Synchronized Movie Night', 'Set up, grab your popcorn, countdown together, and dive into your chosen film.', 'guided_date', 'dates', 'live', 60, 'tv', '{
  "steps": [
    {"id": "step1", "title": "Snack & Drink Prep", "duration_minutes": 5, "prompt": "Get your popcorn, snacks, drinks, and cozy blankets ready.", "description": "Get your popcorn, snacks, drinks, and cozy blankets ready.", "checklist": ["Popcorn & snacks ready", "Cozy blankets & cushions", "Movie paused at 00:00 on screen"]},
    {"id": "step2", "title": "Sync & 3-2-1 Play!", "duration_minutes": 3, "prompt": "Cue up your selected movie on both screens. Use our synced countdown timer to press Play at the exact same second!", "description": "Cue up your selected movie on both screens. Use our synced countdown timer to press Play at the exact same second!"},
    {"id": "step3", "title": "Movie In Progress", "duration_minutes": 50, "prompt": "Enjoy the show! Send quick live emoji reactions to each other right from the screen.", "description": "Enjoy the show! Send quick live emoji reactions to each other right from the screen."},
    {"id": "step4", "title": "Post-Credits Review", "duration_minutes": 10, "prompt": "Rate the movie out of 10. Discuss your favorite scene and the craziest plot twist.", "description": "Rate the movie out of 10. Discuss your favorite scene and the craziest plot twist."}
  ]
}'::jsonb),

('guided-date-cooking-together', 'Cooking Together Across the Miles', 'Cook the same recipe or style of food simultaneously, sharing aromas, tasting spoons, and laughter.', 'guided_date', 'dates', 'live', 45, 'coffee', '{
  "steps": [
    {"id": "step1", "title": "Kitchen Setup & Ingredient Check", "duration_minutes": 5, "prompt": "Wash your hands, clear the counter, prop your phone up safely, and lay out your ingredients.", "description": "Wash your hands, clear the counter, prop your phone up safely, and lay out your ingredients.", "checklist": ["Phone propped up safely", "Ingredients & spices on counter", "Cooking playlist playing", "Apron / comfy clothes on"]},
    {"id": "step2", "title": "Prep & Chop Together", "duration_minutes": 15, "prompt": "Chop, slice, and measure your ingredients. Compare your knife skills and share what smells amazing!", "description": "Chop, slice, and measure your ingredients. Compare your knife skills and share what smells amazing!"},
    {"id": "step3", "title": "Sizzle & Simmer", "duration_minutes": 15, "prompt": "Stove on! Sizzle your ingredients, stir the pot, and taste test. Describe the flavors to each other.", "description": "Stove on! Sizzle your ingredients, stir the pot, and taste test. Describe the flavors to each other."},
    {"id": "step4", "title": "Plate & Presentation Contest", "duration_minutes": 10, "prompt": "Plate your dishes like a 5-star restaurant! Hold up your plates to the camera and judge each other''s food art.", "description": "Plate your dishes like a 5-star restaurant! Hold up your plates to the camera and judge each other''s food art.", "checklist": ["Plated like 5-star restaurant", "Photo snapped of dishes", "First bite tasted together"]}
  ]
}'::jsonb),

('guided-date-music-date', 'Music Date: Melody & Memory Swap', 'Exchange songs that define your journey, listen simultaneously, and share the untold stories behind each track.', 'guided_date', 'dates', 'live', 30, 'music', '{
  "steps": [
    {"id": "step1", "title": "Setting the Soundstage", "duration_minutes": 5, "prompt": "Grab your best headphones or speaker, get comfortable, and queue up your favorite music apps.", "description": "Grab your best headphones or speaker, get comfortable, and queue up your favorite music apps.", "checklist": ["Headphones or speaker connected", "Favorite beverage in hand", "Music app opened"]},
    {"id": "step2", "title": "The Song That Reminds Me of You", "duration_minutes": 10, "prompt": "Partner A plays a song that reminds them of Partner B. Listen together, then explain why this song captures them.", "description": "Partner A plays a song that reminds them of Partner B. Listen together, then explain why this song captures them."},
    {"id": "step3", "title": "Our Shared Nostalgia Anthem", "duration_minutes": 10, "prompt": "Partner B plays a track from a shared memory or trip. Relive the exact day and feeling when you both heard it.", "description": "Partner B plays a track from a shared memory or trip. Relive the exact day and feeling when you both heard it."},
    {"id": "step4", "title": "Future Roadtrip / Slow Dance Track", "duration_minutes": 5, "prompt": "Pick one song for our future road trip or dream slow dance. Close your eyes and imagine the moment together.", "description": "Pick one song for our future road trip or dream slow dance. Close your eyes and imagine the moment together."}
  ]
}'::jsonb),

('guided-date-question-date', 'Deep Question Date: Heart to Heart', 'A quiet sanctuary of meaningful questions to discover new depths in each other without distraction.', 'guided_date', 'dates', 'live', 35, 'message-circle', '{
  "steps": [
    {"id": "step1", "title": "Unwind & Settle In", "duration_minutes": 5, "prompt": "Turn off distractions, put notifications on silent, and take a deep breath together.", "description": "Turn off distractions, put notifications on silent, and take a deep breath together.", "checklist": ["Distractions silenced", "Comfortable quiet space", "Open mind & warm heart"]},
    {"id": "step2", "title": "The Moment I Realized", "duration_minutes": 10, "prompt": "What was the exact moment you realized you had feelings for me? What was going through your mind?", "description": "What was the exact moment you realized you had feelings for me? What was going through your mind?"},
    {"id": "step3", "title": "Silent Strength & Support", "duration_minutes": 10, "prompt": "What is something you are silently carrying or hoping for right now that I can support you in?", "description": "What is something you are silently carrying or hoping for right now that I can support you in?"},
    {"id": "step4", "title": "Our Next Chapter", "duration_minutes": 10, "prompt": "When you imagine us 5 years from now on a typical Sunday morning, what does it look and feel like?", "description": "When you imagine us 5 years from now on a typical Sunday morning, what does it look and feel like."}
  ]
}'::jsonb),

('guided-date-dream-vacation', 'Dream Vacation Blueprint', 'Co-create your next reunion getaway: choose the destination, dream stay, secret cafes, and bucket-list adventures.', 'guided_date', 'dates', 'live', 40, 'compass', '{
  "steps": [
    {"id": "step1", "title": "Destination Draft", "duration_minutes": 5, "prompt": "Pick a destination vibe: tropical beach, cozy mountain cabin, or historic walking city? Agree on one place for tonight!", "description": "Pick a destination vibe: tropical beach, cozy mountain cabin, or historic walking city? Agree on one place for tonight!", "checklist": ["Destination vibe agreed upon", "Shared excitement ready", "Map opened"]},
    {"id": "step2", "title": "Our Dream Stay", "duration_minutes": 10, "prompt": "What kind of stay are we booking? A treehouse with a hot tub? An oceanfront villa? A cozy loft? Browse and describe it.", "description": "What kind of stay are we booking? A treehouse with a hot tub? An oceanfront villa? A cozy loft? Browse and describe it."},
    {"id": "step3", "title": "The Foodie & Cafe Itinerary", "duration_minutes": 15, "prompt": "Plan day one''s meals: What are we having for breakfast in bed, street food lunch, and a sunset dinner?", "description": "Plan day one''s meals: What are we having for breakfast in bed, street food lunch, and a sunset dinner?"},
    {"id": "step4", "title": "The One Unmissable Adventure", "duration_minutes": 10, "prompt": "Pick one unforgettable adventure to experience there: snorkeling, night market tour, stargazing hike, or wine tasting.", "description": "Pick one unforgettable adventure to experience there: snorkeling, night market tour, stargazing hike, or wine tasting."}
  ]
}'::jsonb),

('guided-date-random-date-idea', 'Random Date Surprise Roulette', 'Fast, spontaneous, and unpredictable mini-games and challenges to keep your spark energetic and playful.', 'guided_date', 'dates', 'live', 25, 'sparkles', '{
  "steps": [
    {"id": "step1", "title": "Coin Toss for the Vibe", "duration_minutes": 5, "prompt": "Flip a coin: Heads means Partner A picks the music and vibe, Tails means Partner B picks!", "description": "Flip a coin: Heads means Partner A picks the music and vibe, Tails means Partner B picks!", "checklist": ["Coin or random generator ready", "Vibe master chosen"]},
    {"id": "step2", "title": "3-Minute Blind Portrait", "duration_minutes": 5, "prompt": "Grab a pen and paper. You have 3 minutes to draw your partner from memory. No looking at paper while drawing!", "description": "Grab a pen and paper. You have 3 minutes to draw your partner from memory. No looking at paper while drawing!"},
    {"id": "step3", "title": "Room Treasure Show & Tell", "duration_minutes": 10, "prompt": "Find the weirdest, oldest, or most sentimental item in your room right now. Present it to your partner like an auctioneer!", "description": "Find the weirdest, oldest, or most sentimental item in your room right now. Present it to your partner like an auctioneer!"},
    {"id": "step4", "title": "60-Second Compliment Blitz", "duration_minutes": 5, "prompt": "Take turns showering each other with rapid-fire genuine compliments for 60 seconds each without stopping!", "description": "Take turns showering each other with rapid-fire genuine compliments for 60 seconds each without stopping!"}
  ]
}'::jsonb),

('guided-date-stargazing', 'Late Night Stargazing & Whispers', 'Step outside or look through your window into the night sky together.', 'guided_date', 'relaxed', 'live', 30, 'star', '{
  "steps": [
    {"id": "step1", "title": "Look Up Together", "duration_minutes": 5, "description": "Find a window or step onto your balcony/yard. Look at the moon and stars knowing your partner is under that same sky."},
    {"id": "step2", "title": "Share a Wish", "duration_minutes": 10, "description": "If you could whisper one wish to a shooting star right now, what would it be?"},
    {"id": "step3", "title": "Future Home Blueprint", "duration_minutes": 15, "description": "Imagine our dream home together: what does the kitchen look like? Is there a porch or a big window?"}
  ]
}'::jsonb),

('guided-date-book-club', 'Two-Person Cozy Book Club', 'Read a chapter of a shared book or poem out loud to each other.', 'guided_date', 'relaxed', 'live', 35, 'book-open', '{
  "steps": [
    {"id": "step1", "title": "Settle In With Warm Tea", "duration_minutes": 5, "description": "Grab a hot drink, cozy cushions, and open your shared chapter."},
    {"id": "step2", "title": "Taking Turns Reading", "duration_minutes": 20, "description": "Partner A reads page 1, Partner B reads page 2. Listen to the soothing sound of your partner''s voice."},
    {"id": "step3", "title": "Thoughts & Reactions", "duration_minutes": 10, "description": "Discuss your favorite line and what the story made you feel."}
  ]
}'::jsonb),

-- Deep Talk & Conversation Cards
('deep-talk-vulnerability', 'Deep Talk: Heart to Heart', 'Meaningful, gentle questions to understand each other on a deeper layer.', 'quiz', 'deep_talk', 'both', 20, 'message-circle', '{
  "rounds": [
    {"id": 1, "question": "What is a fear you carry that you rarely speak out loud?", "type": "free_text"},
    {"id": 2, "question": "When do you feel most safe, seen, and accepted by me?", "type": "free_text"},
    {"id": 3, "question": "What is one dream you hope we accomplish together in the next 3 years?", "type": "free_text"},
    {"id": 4, "question": "How can I better support you when you are having an emotionally draining day?", "type": "free_text"}
  ]
}'::jsonb),

('deep-talk-future-dreams', 'Building Our Future Vision', 'Align on your long-term hopes, careers, values, and shared life.', 'quiz', 'deep_talk', 'both', 20, 'compass', '{
  "rounds": [
    {"id": 1, "question": "Where in the world would you love for us to build our home base?", "type": "free_text"},
    {"id": 2, "question": "What tradition from our families do you want to keep, and what new one should we create?", "type": "free_text"},
    {"id": 3, "question": "What does a truly peaceful, successful weekend look like to you in 5 years?", "type": "free_text"}
  ]
}'::jsonb)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  config = EXCLUDED.config,
  duration_minutes = EXCLUDED.duration_minutes,
  category = EXCLUDED.category,
  mode = EXCLUDED.mode;

