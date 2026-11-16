const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } 	= require("discord.js")
const { Random } 															= require("random-js")
const dh 	= require("../../handlers/dataHandler.js")
const eh 	= require("../../handlers/errorHandler.js")
const ch    = require('../../handlers/cardHandler.js')
const xh	= require('../../handlers/xpHandler.js')
const dev   = require('../../handlers/dev.js')
const ah	= require('../../handlers/assetHandler.js')

const random = new Random()
const colors = ah.colors()
const values =
{
	"ace": 		14,
	"2": 		2,
	"3": 		3,
	"4": 		4,
	"5": 		5,
	"6": 		6,
	"7": 		7,
	"8": 		8,
	"9": 		9,
	"10": 		10,
	"jack": 	11,
	"queen": 	12,
	"king": 	13
}

const secretcard	= ah.cards(true)

async function main(interaction, bet, userStats, UID)
{
	const deck 		= await ch.create(UID)
	const xp_rew	= Math.floor(bet / 7)

	if(!deck.success) return eh.error(interaction, deck.reason)

	let winning_hand	= { string: "", name: "" }
	let reward 			= 0
	let hands =
	{
		player:
		{
			hand: [],
			emojis: []
		},
		dealer:
		{
			hand: [],
			emojis: []
		},
		community:
		{
			hand: [],
			emojis: []
		},
	}

	for(let i = 0; i < 3; i++)
	{
		hands.player = await draw(UID, hands.player)
		hands.dealer = await draw(UID, hands.dealer)
	}

	await ch.burn(UID)

	for(let i = 0; i < 3; i++)
	{
		hands.community = await draw(UID, hands.community)
	}


	const row	= new ActionRowBuilder()
	const embed = new EmbedBuilder()
	.setTitle("Pinapple Poker")
	.setDescription(`Dealer: ${secretcard}${secretcard}${secretcard}, You: ${hands.player.emojis.join("")} \nCommunity Cards: ${hands.community.emojis.join("")} \n-# Choose a card to discard`)

	for(let i = 0; i < 3; i++)
	{
		const button = new ButtonBuilder()
		.setCustomId(i.toString())
		.setEmoji(hands.player.emojis[i])
		.setStyle(ButtonStyle.Secondary)

		row.addComponents(button)
	}

	let initial = await interaction.editReply({ embeds: [embed], components: [row] })

	const press = await new Promise(resolve =>
	{
		const collector = initial.createMessageComponentCollector({ time: 10_000 })

		collector.on("collect", async button =>
		{
			if(button.user.id !== UID) 	return button.reply({ content: "This isn't your game!", ephemeral: true})

			const discard = random.integer(0, 2)

			hands.dealer.hand.splice(discard, 1)
			hands.dealer.emojis.splice(discard, 1)
			hands.player.hand.splice(Number(button.customId), 1)
			hands.player.emojis.splice(Number(button.customId), 1)

			button.deferUpdate()

			row.components.forEach(button =>
			{
				button.setDisabled(true)
			})

			collector.stop("played")
		})

		collector.on("end", async (collected, reason) =>
		{
			if(reason === "time")
			{
				embed
				.setColor(colors.red)
				.setDescription("Time")

				return resolve()
			}
			if(reason === "played")
			{
				await ch.burn(UID)

				for(let i = 0; i < 2; i++)
				{
					hands.community = await draw(UID, hands.community)
				}

				embed
				.setTitle("Pinapple Poker")
				.setDescription(`Dealer: ${hands.dealer.emojis.join("")}, You: ${hands.player.emojis.join("")} \nCommunity Cards: ${hands.community.emojis.join("")} \n-# *Calculating...*`)

				await interaction.editReply({ embeds: [embed], components: [row] })

				const player_cards 	= [...hands.player.hand, ...hands.community.hand]
				const dealer_cards 	= [...hands.dealer.hand, ...hands.community.hand]
				const final 		= await wincon(interaction, player_cards, dealer_cards)

				if(final.won === 0) //lost, dealer had better hand
				{
					embed
					.setColor(colors.red)
					.setTitle(`You lost!`)
					.setDescription(`Dealer: ${hands.dealer.emojis.join("")}*(${final.hands[1]})*, You: ${hands.player.emojis.join("")}*(${final.hands[0]})* \nCommunity Cards: ${hands.community.emojis.join("")}`)

					await xh.achievements(userStats, userStats.chips + bet, false, 8, 0)
				}
				else if(final.won === 1) //won
				{
					reward = bet * 2

					embed
					.setColor(colors.green)
					.setTitle(`You won!`)
					.setDescription(`Dealer: ${hands.dealer.emojis.join("")}*(${final.hands[1]})*, You: ${hands.player.emojis.join("")}*(${final.hands[0]})* \nCommunity Cards: ${hands.community.emojis.join("")} \n-# *Won ${reward} Chips*`)

					userStats.chips += reward
					await xh.leveling(userStats, xp_rew)
					await xh.achievements(userStats, userStats.chips - reward, true, 8, reward, bet, final.hands[0])

				}
				else if(final.won === 2) //tied
				{
					embed
					.setColor(colors.orange)
					.setTitle(`Tied!`)
					.setDescription(`Dealer: ${hands.dealer.emojis.join("")}*(${final.hands[1]})*, You: ${hands.player.emojis.join("")}*(${final.hands[0]})* \nCommunity Cards: ${hands.community.emojis.join("")}`)

					userStats.chips += bet
					await xh.achievements(userStats, userStats.chips, false, 8, 0)
				}
				else //lost, didnt qualify
				{
					embed
					.setColor(colors.red)
					.setTitle(`You didn't qualify!`)
					.setDescription(`Dealer: ${hands.dealer.emojis.join("")}*(${final.hands[1]})*, You: ${hands.player.emojis.join("")}*(${final.hands[0]})* \nCommunity Cards: ${hands.community.emojis.join("")}`)

					await xh.achievements(userStats, userStats.chips + bet, false, 8, 0)
				}

				resolve()
			}
		})
	})

	return end(userStats, interaction, embed, bet, UID)
}

async function draw(UID, current)
{
	const drawn = await ch.draw(UID)

	current.hand.push(drawn.suited)
	current.emojis.push(drawn.emoji)

	return current
}

async function wincon(interaction, player_cards, dealer_cards)
{
	const playerFinal = await ch.calculate(player_cards, values)
	const dealerFinal = await ch.calculate(dealer_cards, values)

	const qualified = qualifier(playerFinal)

	if(!qualified)
	{
		return { won: 3, hands: [playerFinal.hand, dealerFinal.hand] };
	}

	if(playerFinal.rank > dealerFinal.rank) return { won: 1, hands: [playerFinal.hand, dealerFinal.hand] }
	if(playerFinal.rank	< dealerFinal.rank) return { won: 0, hands: [playerFinal.hand, dealerFinal.hand] }

	for(let i = 0; i < Math.min(playerFinal.kickers.length, dealerFinal.kickers.length); i++)
	{
		if(playerFinal.kickers[i] > dealerFinal.kickers[i])
		{
			return {won: 1, hands: [playerFinal.hand, dealerFinal.hand] }
		}

		if(playerFinal.kickers[i] < dealerFinal.kickers[i])
		{
			return { won: 0, hands: [playerFinal.hand, dealerFinal.hand] }
		}
	}

	return { won: 2, hands: [playerFinal.hand, dealerFinal.hand] }
}

function qualifier(final)
{
	if (final.rank === 1) 	return false;
	else					return true;
}


async function end(userStats, interaction, embed, bet, UID)
{
	userStats.active_game = false;
	dh.userSave(userStats)
	ch.remove(UID)

	initial = await interaction.editReply({ embeds: [embed], components:[] })
}

module.exports =
{

	main,
}
