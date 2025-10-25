# Feature Specification: Texas Hold'em Poker Game

**Feature Branch**: `001-texas-holdem-poker`
**Created**: 2025-10-25
**Status**: Draft
**Input**: User description: "Build a web game that allows friends to play Texas Hold'em Poker with vegas style rules. The game should allow tables to be created or joined with a 4 digit code. Each player should be able to access the Cashier when not sitting at a table where they can cash out their chips and have their ledger updated. Each player can get chips at the table and their ledger be updated. No payment information is used in the app, but the ledger will keep track of what a player owes. The Cashier should present that info transparently to all players. When a player gets chips the info is also viewable within there user profile. Keep in strict adherence with vegas rules around dealing players in, waiting for the big blind before a player starts, blinds, etc. Unlike Vegas, table dealers do not take an rake so the Cashier ledger is a complete reflection of player activity. A view of the table should be shareable so that it can be shared on apps like Discord and presented to all players. There should also be a view for a player's betting and hand, that can be really small. It doesn't have to show the table cards. There should be table options on whether the player hand view also shows what hand the player has (pair, high card, flush, etc.). There should also be admin options for min-buy-in and buy-in timer and blind amount and blind timers. Making this app visually appealing is not a priority, but accessibility (visible cards, usable functionality, reliability) is of the most important. This app is a hobby game meant to be played by one friend group - so it just has to be reliable and secure (other players shouldn't be able to find out other hands). Each table should have a history of public hand information. Each player should be able to show or muck cards in accordance with Vegas rules. Hand timers should also be in place and customizable in table settings to keep games going with attention getting UI on the player hand view."

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Create and Join Tables (Priority: P1)

Players need a way to quickly create or join private poker tables with their friends without complicated setup or account creation.

**Why this priority**: This is the core entry point to the game. Without the ability to create and join tables, no other features can function. It's the minimal viable product that enables friends to start playing together.

**Independent Test**: Can be fully tested by creating a table with a 4-digit code, having another player join using that code, and verifying both players see the table lobby. Delivers the value of connecting players to the same game space.

**Acceptance Scenarios**:

1. **Given** a player is on the home screen, **When** they choose to create a new table, **Then** the system generates a unique 4-digit code and creates a new table with the player as the host
2. **Given** a player has a 4-digit table code, **When** they enter the code and join, **Then** they are added to that table's lobby and can see other players
3. **Given** a player tries to join with an invalid code, **When** they submit the code, **Then** they receive a clear error message that the table doesn't exist
4. **Given** a table is full (maximum players reached), **When** another player tries to join, **Then** they receive a message that the table is full
5. **Given** a player is in a table lobby, **When** the host starts the game, **Then** all players transition to the active game state

---

### User Story 2 - Play Texas Hold'em Hands (Priority: P1)

Players need to play complete Texas Hold'em poker hands following Vegas rules, including betting rounds, card dealing, and hand resolution.

**Why this priority**: This is the core gameplay. Without the ability to play actual poker hands, the application has no purpose. This must work for the product to have any value.

**Independent Test**: Can be fully tested by having 2+ players at a table, playing through a complete hand from blinds posting through showdown, and verifying the pot is awarded correctly and all Vegas rules are followed.

**Acceptance Scenarios**:

1. **Given** a game has started, **When** it's a player's turn, **Then** they can fold, call, or raise within the allowed betting limits
2. **Given** all players have acted in a betting round, **When** the round completes, **Then** the next community cards are dealt (flop, turn, or river) or hand goes to showdown
3. **Given** only one player remains (others folded), **When** the hand ends, **Then** that player wins the pot without revealing cards
4. **Given** multiple players reach showdown, **When** cards are revealed, **Then** the player with the best 5-card hand wins the pot
5. **Given** it's a player's turn, **When** their action timer expires, **Then** their hand is automatically folded
6. **Given** a new player wants to join mid-game, **When** they sit down, **Then** they must wait until the big blind position to be dealt in
7. **Given** a player posts the big blind for the first time, **When** the betting round reaches them, **Then** they are dealt into the hand
8. **Given** blinds are due, **When** a new hand starts, **Then** the small blind and big blind are automatically posted by the correct players

---

### User Story 3 - Cashier and Chip Management (Priority: P2)

Players need to track their chip balances, buy chips, cash out, and view their financial ledger across all game sessions.

**Why this priority**: While not required for basic gameplay, this is essential for tracking who owes what among friends. Without this, the game is just play money with no stakes tracking.

**Independent Test**: Can be fully tested by having a player buy chips, play some hands, then cash out, and verifying the ledger accurately reflects all transactions and balances.

**Acceptance Scenarios**:

1. **Given** a player is not seated at a table, **When** they access the Cashier, **Then** they can see their current chip balance and ledger history
2. **Given** a player is at the Cashier, **When** they request to buy chips for a specific amount, **Then** their chip balance increases and the transaction is recorded in their ledger with a negative balance (they owe this amount)
3. **Given** a player is at the Cashier with chips, **When** they cash out chips, **Then** their chip balance decreases and the transaction is recorded in their ledger (reducing what they owe or increasing what they're owed)
4. **Given** any player views the Cashier, **When** they look at ledger information, **Then** they can see all players' net balances transparently (who owes money and who is owed money)
5. **Given** a player is seated at a table, **When** they try to access the Cashier, **Then** they are prevented from doing so (must stand up from table first)
6. **Given** a player is at a table, **When** they buy more chips at the table, **Then** their chip stack increases and their ledger is updated with the transaction
7. **Given** a player's ledger has transactions, **When** they view their profile, **Then** they can see their complete transaction history

---

### User Story 4 - Table Configuration and Admin Controls (Priority: P2)

Table hosts need to configure game parameters like blinds, buy-in amounts, and timers to control the pace and stakes of the game.

**Why this priority**: Different friend groups have different preferences for game speed and stakes. This flexibility makes the game suitable for various play styles without being required for basic functionality.

**Independent Test**: Can be fully tested by creating a table, setting custom blind amounts and timers, starting a game, and verifying the configured rules are enforced during play.

**Acceptance Scenarios**:

1. **Given** a player creates a new table, **When** they access table settings, **Then** they can set minimum buy-in amount, blind amounts, blind increase timer, and action timer
2. **Given** a table has custom settings, **When** a player tries to sit down with insufficient chips, **Then** they are prevented from joining until they meet the minimum buy-in
3. **Given** a blind timer is configured, **When** the timer expires during play, **Then** blinds automatically increase according to the configured schedule
4. **Given** an action timer is set, **When** it's a player's turn, **Then** they have the configured time to act before their hand is automatically folded
5. **Given** a table host changes settings, **When** a hand is in progress, **Then** the changes take effect at the start of the next hand (not mid-hand)

---

### User Story 5 - Shareable Views for Streaming (Priority: P3)

Players need shareable views of the table and their personal hand/betting interface so they can stream or share the game with others watching (e.g., on Discord).

**Why this priority**: This enhances the social experience but isn't required for playing the game. It's a nice-to-have feature for groups that want to broadcast their games.

**Independent Test**: Can be fully tested by generating shareable table and personal hand views, opening them in separate windows/screens, and verifying they display the correct real-time information without exposing hidden information.

**Acceptance Scenarios**:

1. **Given** a player is at a table, **When** they request a shareable table view, **Then** the system generates a URL that displays the table state (community cards, pot, player positions) without showing any player's hole cards
2. **Given** a player is in a hand, **When** they request a personal hand view, **Then** the system generates a compact URL showing only their chips, current bet, and action buttons
3. **Given** the table setting allows hand strength display, **When** a player views their personal hand view, **Then** it shows their hand strength (pair, flush, etc.) in addition to betting controls
4. **Given** the table setting disables hand strength display, **When** a player views their personal hand view, **Then** it only shows their hole cards and betting controls without hand evaluation
5. **Given** a shareable view is open, **When** game state changes (new cards dealt, bets placed), **Then** the view updates in real-time to reflect the current state

---

### User Story 6 - Hand History and Card Reveal Rules (Priority: P3)

Players need to view the history of completed hands and follow Vegas rules for showing or mucking cards at showdown.

**Why this priority**: This adds transparency and follows proper poker etiquette but isn't essential for basic gameplay. Players can play without hand history tracking.

**Independent Test**: Can be fully tested by playing several hands with various outcomes (showdowns, folds), players choosing to show or muck cards, and verifying the hand history accurately records public information according to Vegas rules.

**Acceptance Scenarios**:

1. **Given** a hand reaches showdown, **When** a player must show cards, **Then** they have the option to show all cards or muck (fold without showing) according to Vegas rules
2. **Given** a player wins by others folding, **When** the hand ends, **Then** the player can choose to show their cards voluntarily or muck them
3. **Given** cards are shown at showdown, **When** the hand completes, **Then** those cards are recorded in the public hand history
4. **Given** cards are mucked, **When** the hand completes, **Then** the hand history shows the player mucked without revealing the specific cards
5. **Given** a table has hand history, **When** a player views the history, **Then** they can see all completed hands with public information (pot size, community cards, shown cards, winners)
6. **Given** a player was all-in, **When** showdown occurs, **Then** their cards must be shown according to Vegas rules (cannot muck when all-in)

---

### Edge Cases

- What happens when a player disconnects mid-hand? System should auto-fold their hand and mark them as disconnected, allowing them to reconnect and rejoin.
- What happens when only one player remains at a table? The table should remain open but the game cannot start until at least two players are present.
- What happens when two players have identical hands at showdown? The pot should be split equally between them.
- What happens if a player tries to bet more chips than they have? The system should only allow bets up to their current chip stack (all-in).
- What happens when a player's ledger balance would go negative (owes more than a reasonable amount)? System enforces a hard maximum debt limit per player (configurable by table host, e.g., $1000 default cap) and prevents chip purchases once limit is reached.
- What happens if a 4-digit table code collision occurs (same code generated twice)? The system should ensure codes are unique across all active tables.
- What happens when a blind timer expires but a hand is in progress? The blind increase should be queued and applied at the start of the next hand.
- What happens if the table host leaves? Host privileges automatically transfer to the next player (longest-seated player or first in seat order), ensuring game continuity.
- What happens when a player tries to buy chips at a table but it would exceed a maximum stack limit? System enforces a table-level maximum stack size (configurable by host, e.g., 200 big blinds) and prevents chip additions that would exceed this limit.

## Requirements _(mandatory)_

### Functional Requirements

#### Table Management

- **FR-001**: System MUST allow players to create new poker tables with automatically generated unique 4-digit codes
- **FR-002**: System MUST allow players to join existing tables by entering a valid 4-digit code
- **FR-003**: System MUST support a configurable maximum number of players per table (standard Texas Hold'em supports 2-10 players)
- **FR-004**: System MUST prevent players from joining full tables
- **FR-005**: System MUST display all players currently in the table lobby with their chip stacks
- **FR-006**: System MUST allow table hosts to configure minimum buy-in amounts
- **FR-007**: System MUST allow table hosts to configure blind amounts (small blind and big blind)
- **FR-008**: System MUST allow table hosts to configure blind increase intervals (timer-based)
- **FR-009**: System MUST allow table hosts to configure player action timers
- **FR-010**: System MUST allow table hosts to start games when at least 2 players are present
- **FR-011**: System MUST allow table hosts to configure maximum debt limit per player (default $1000)
- **FR-012**: System MUST allow table hosts to configure maximum stack size at table (e.g., 200 big blinds)
- **FR-013**: System MUST automatically transfer host privileges to the next player (longest-seated or first in order) when the current host leaves the table

#### Game Rules and Mechanics

- **FR-014**: System MUST shuffle deck using Gilbert-Shannon-Reeds model for each hand
- **FR-015**: System MUST deal two hole cards to each active player at the start of each hand
- **FR-016**: System MUST deal community cards in proper sequence: 3 cards (flop), 1 card (turn), 1 card (river)
- **FR-017**: System MUST automatically post small blind and big blind from the appropriate players before each hand
- **FR-018**: System MUST rotate dealer button clockwise after each hand
- **FR-019**: System MUST rotate blind positions (small blind and big blind) with the dealer button
- **FR-020**: System MUST enforce new players wait until big blind position before being dealt into a hand
- **FR-021**: System MUST require players posting big blind for the first time before receiving cards
- **FR-022**: System MUST allow players to fold, call, or raise during their turn
- **FR-023**: System MUST enforce minimum and maximum bet sizes according to table limits
- **FR-024**: System MUST prevent players from betting more chips than they currently have
- **FR-025**: System MUST handle all-in situations when a player bets all their chips
- **FR-026**: System MUST create side pots when players are all-in with different amounts
- **FR-027**: System MUST automatically fold a player's hand when their action timer expires
- **FR-028**: System MUST evaluate poker hands according to standard hand rankings (high card through royal flush)
- **FR-029**: System MUST award the pot to the player with the best 5-card hand at showdown
- **FR-030**: System MUST award the pot to the last remaining player if all others fold
- **FR-031**: System MUST split pots equally when multiple players have identical best hands
- **FR-032**: System MUST enforce Vegas rules for showing/mucking cards at showdown
- **FR-033**: System MUST require all-in players to show cards at showdown (cannot muck)

#### Cashier and Ledger

- **FR-034**: System MUST provide a Cashier interface accessible only when players are not seated at tables
- **FR-035**: System MUST allow players to buy chips and record the transaction in their ledger as debt
- **FR-036**: System MUST enforce maximum debt limit per player as configured by table host
- **FR-037**: System MUST prevent chip purchases when player has reached their maximum debt limit
- **FR-038**: System MUST allow players to cash out chips and record the transaction in their ledger
- **FR-039**: System MUST display each player's current chip balance in their profile
- **FR-040**: System MUST display each player's complete transaction history in their ledger
- **FR-041**: System MUST display all players' net balances transparently in the Cashier (showing who owes what)
- **FR-042**: System MUST allow players to buy additional chips while seated at a table
- **FR-043**: System MUST enforce maximum stack size when players attempt to add chips at table
- **FR-044**: System MUST prevent chip additions that would exceed the table's maximum stack size
- **FR-045**: System MUST update ledger immediately when chips are bought at a table
- **FR-046**: System MUST track all chip movements without involving real payment processing
- **FR-047**: System MUST ensure ledger accurately reflects all chip transactions (no rake taken)

#### Shareable Views

- **FR-048**: System MUST generate a shareable table view URL that displays public game state
- **FR-049**: Shareable table view MUST show community cards, pot size, and player positions without revealing hole cards
- **FR-050**: System MUST generate a personal hand view URL for each player
- **FR-051**: Personal hand view MUST display player's hole cards, current bet, and action controls
- **FR-052**: Personal hand view MUST be compact and suitable for small displays
- **FR-053**: System MUST allow table settings to toggle whether personal hand view shows hand strength evaluation
- **FR-054**: When enabled, personal hand view MUST display current hand strength (pair, two pair, flush, etc.)
- **FR-055**: Shareable views MUST update in real-time as game state changes

#### Hand History

- **FR-056**: System MUST record completed hands in a table history
- **FR-057**: Hand history MUST include pot size, community cards, and winners
- **FR-058**: Hand history MUST record which cards were shown at showdown
- **FR-059**: Hand history MUST indicate when cards were mucked without revealing them
- **FR-060**: System MUST allow players to view hand history for their current table

#### Security and Access Control

- **FR-061**: System MUST ensure players can only see their own hole cards
- **FR-062**: System MUST prevent players from viewing other players' hole cards during play
- **FR-063**: System MUST ensure shareable table views do not expose private information (hole cards)
- **FR-064**: System MUST validate all player actions are only processed during that player's turn
- **FR-065**: System MUST ensure 4-digit table codes are unique across all active tables

#### Accessibility and Reliability

- **FR-066**: System MUST use color blind friendly color palettes with high contrast and distinct hues
- **FR-067**: System MUST ensure card suits are distinguishable without relying solely on color (use symbols, patterns, or text labels)
- **FR-068**: System MUST use colors that are very distinct from each other for all game elements (cards, chips, buttons, status indicators)
- **FR-069**: System MUST display cards with sufficient contrast and size for readability
- **FR-070**: System MUST provide clear visual indicators for whose turn it is
- **FR-071**: System MUST provide attention-getting UI on personal hand view when action is required
- **FR-072**: System MUST display action timer countdown clearly to players
- **FR-073**: System MUST handle player disconnections gracefully (auto-fold and allow reconnection)
- **FR-074**: System MUST persist game state to allow players to reconnect after disconnection

### Key Entities

- **Player**: Represents a user in the system with a unique identifier, username, chip balance, and transaction ledger
- **Table**: Represents a poker game instance with a 4-digit code, host, configuration settings (blinds, timers, buy-ins), current game state, and list of seated players
- **Hand**: Represents a single poker hand being played, including dealer position, community cards, pot(s), and current betting round
- **PlayerHand**: Represents a player's participation in a specific hand, including hole cards, current bet, chip stack, and state (active, folded, all-in)
- **Ledger**: Represents a player's transaction history, including chip purchases (debits) and cash-outs (credits), with running balance
- **HandHistory**: Represents completed hand records, including final pot amount, community cards, winning player(s), and cards shown at showdown
- **ShareableView**: Represents a generated URL for either a table view or personal hand view, with real-time game state updates

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Players can create a table and have another player join using the 4-digit code in under 30 seconds
- **SC-002**: System can support at least 10 concurrent tables with 6-10 players each without performance degradation
- **SC-003**: 100% of game actions (fold, call, raise) are processed and reflected in game state within 500ms
- **SC-004**: Players can complete a full poker hand (blinds through showdown) in under 5 minutes with 6 players
- **SC-005**: 100% of Vegas Hold'em rules are correctly enforced (blind rotation, dealing in rules, showdown rules)
- **SC-006**: Hand history records 100% of completed hands with accurate pot and card information
- **SC-007**: Ledger reflects 100% of chip transactions accurately with no discrepancies
- **SC-008**: All players can view the Cashier ledger and see identical balance information (100% transparency)
- **SC-009**: Shareable views update in real-time with no more than 1 second delay from actual game state
- **SC-010**: Players can identify whose turn it is within 2 seconds of looking at any interface (table or personal view)
- **SC-011**: 95% of players can successfully complete their first game session without confusion or errors
- **SC-012**: System maintains 99% uptime during active game sessions (minimal disconnections or crashes)
- **SC-013**: Zero instances of players seeing other players' hole cards during testing
- **SC-014**: Action timers expire correctly 100% of the time and automatically fold the player
- **SC-015**: Players can reconnect after disconnection and rejoin their table within 15 seconds
- **SC-016**: 100% of color blind users can distinguish all card suits and game elements without relying on color alone
- **SC-017**: Maximum debt limit prevents 100% of attempts to purchase chips beyond configured limit
- **SC-018**: Maximum stack size prevents 100% of attempts to add chips beyond table maximum
- **SC-019**: Host privileges transfer successfully 100% of the time when host leaves table

## Assumptions

1. **Player Authentication**: Assuming basic username-based identification is sufficient for a friend group hobby game (no email verification or password recovery needed)
2. **Table Persistence**: Assuming tables exist for the duration of the game session and are automatically cleaned up when all players leave
3. **Maximum Players**: Assuming standard 10-player maximum per table (typical for Texas Hold'em)
4. **Default Timers**: Assuming 30-second action timer and 15-minute blind increase timer as defaults if not configured
5. **Default Debt Limit**: Assuming $1000 maximum debt per player as default if not configured by host
6. **Default Stack Limit**: Assuming 200 big blinds as default maximum stack size if not configured by host
7. **Network Reliability**: Assuming reasonably stable network connections; brief disconnections are handled but extended outages may require game restart
8. **Device Compatibility**: Assuming modern web browsers (Chrome, Firefox, Safari) on desktop and mobile devices
9. **Concurrent Sessions**: Assuming players participate in only one table at a time (no multi-tabling)
10. **Ledger Settlement**: Assuming ledger balances are settled outside the application (friends pay each other directly based on ledger information)
11. **No House Rake**: Confirming no rake is taken from pots, making this pure peer-to-peer with accurate ledger tracking
12. **Real-time Updates**: Assuming WebSocket or similar technology will be used to provide real-time game state updates (implementation detail, but necessary for UX expectations)
13. **Hand Evaluation**: Assuming standard poker hand rankings without variations (no wild cards, no special house rules)
14. **Card Deck**: Assuming standard 52-card deck, shuffled using Gilbert-Shannon-Reeds model at the start of each hand
15. **Color Blind Accessibility**: Assuming color blind friendly palettes (e.g., blue/orange, not red/green) with sufficient contrast for all color vision deficiencies

## Out of Scope

The following items are explicitly excluded from this feature:

1. **Real Money Transactions**: No integration with payment processors, credit cards, or actual money transfers
2. **Tournament Mode**: Only cash game format supported; no tournament structures or prize pools
3. **Multi-Table Support**: Players cannot play at multiple tables simultaneously
4. **Mobile Native Apps**: Only web-based interface; no native iOS or Android apps
5. **Advanced Statistics**: No player statistics tracking beyond basic ledger (no win rate, hands played, etc.)
6. **Chat Features**: No in-game chat or messaging between players
7. **Friend Lists**: No social features for managing friend connections or inviting specific users
8. **Customization**: No custom card designs, table themes, or visual customization (functionality over aesthetics)
9. **Poker Variations**: Only Texas Hold'em; no Omaha, Stud, or other poker variants
10. **AI Players**: No computer-controlled players or bots
11. **Replay Feature**: No ability to replay completed hands in detail (only hand history viewing)
12. **Game Recording**: No video or screenshot capture features
13. **External Integrations**: No direct integration with Discord, Twitch, or other platforms (shareable URLs only)
