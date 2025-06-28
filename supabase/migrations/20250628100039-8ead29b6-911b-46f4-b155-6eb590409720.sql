
-- Add foreign key relationship between case_skins and coin_rewards
ALTER TABLE case_skins 
ADD CONSTRAINT fk_case_skins_coin_reward 
FOREIGN KEY (coin_reward_id) REFERENCES coin_rewards(id);
