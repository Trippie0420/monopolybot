'use strict';

const random = require('../randomNumFromRange');
const map = require('./map.json');
const Logger = require('../logger');
const console = new Logger();
const EventEmitter = require('events');
const { communityChest, chance } = require('./cards.json');

class Game extends EventEmitter {
    constructor(client, channel, owner) {
        super();
        this.map = map;
        this.previousPlayer = -1;
        this.currentPlayer = 0;
        this.nextPlayer = 1;
        this.client = client;
        this.channel = channel;
        this.gameOwner = owner.id;
        this.players = [];
        this.bankruptPlayers = [];
        this.active = false;
        this.moving = false;
        this.otherAction = false;
        this.addPlayer(owner);
        channel.createMessage({
            embed: {
                title: 'Let\'s play Monopoly!',
                color: parseInt('00ff00', 16),
                description: 'To join, react with the 🚪!\nTo start, the creator of the game needs to react with ▶\nTo cancel the game, the creator of the game needs to react with ▶\nTo leave, react with 🔚',
                fields: [{
                    name: 'Players',
                    value: `**1.** ${this.players[0] ? `<@${this.players[0].id}>` : 'Empty Slot'}\n**2.** ${this.players[1] ? `<@${this.players[1].id}>` : 'Empty Slot'}\n**3.** ${this.players[2] ? `<@${this.players[2].id}>` : 'Empty Slot'}\n**4.** ${this.players[3] ? `<@${this.players[3].id}>` : 'Empty Slot'}`
                }]
            }
        }).then(msg => {
            this.message = msg;
            this.message.addReaction('🚪').then(() => this.message.addReaction('⏹').then(() => this.message.addReaction('▶').then(() => this.message.addReaction('🔚'))))
            this.reactionAddStart = (mes, emoji, user) => {
                let reactor = mes.channel.guild.members.get(user).user;
                if (this.message.id === mes.id && !reactor.bot && !this.otherAction) {
                    if (emoji.name === '🚪') {
                        if (!this.players.filter(p => p.id === reactor.id)[0]) {
                            this.addPlayer(reactor);
                            this.message.edit({
                                embed: {
                                    title: 'Let\'s play Monopoly!',
                                    color: parseInt('00ff00', 16),
                                    description: 'To join, react with the 🚪!\nTo start, the creator of the game needs to react with ▶\nTo cancel the game, the creator of the game needs to react with ▶\nTo leave, react with 🔚',
                                    fields: [{
                                        name: 'Players',
                                        value: `**1.** ${this.players[0] ? `<@${this.players[0].id}>` : 'Empty Slot'}\n**2.** ${this.players[1] ? `<@${this.players[1].id}>` : 'Empty Slot'}\n**3.** ${this.players[2] ? `<@${this.players[2].id}>` : 'Empty Slot'}\n**4.** ${this.players[3] ? `<@${this.players[3].id}>` : 'Empty Slot'}`
                                    }]
                                }
                            });
                        } else {
                            reactor.getDMChannel().then(chnl => {
                                chnl.createMessage({
                                    embed: {
                                        color: parseInt('ff0000', 16),
                                        title: 'Error',
                                        description: 'You can\'t join a game you\'re already in!'
                                    }
                                });
                            });
                        }
                    } else if (emoji.name === '⏹') {
                        if (this.gameOwner === user) {
                            this.end();
                            this.message.edit({
                                embed: {
                                    title: 'Game canceled',
                                    color: parseInt('ffff00', 16),
                                    description: 'See you again soon!'
                                }
                            }).then(() => {
                                setTimeout(() => {
                                    this.message.delete()
                                }, 5000);
                            });
                        }
                    } else if (emoji.name === '▶') {
                        if (this.gameOwner === user) {
                            if (this.players.length === 1) {
                                this.message.edit({
                                    embed: {
                                        title: 'Monopoly is best played with two people!',
                                        color: parseInt('ffff00', 16),
                                        description: 'Right now, there is no AI for single player mode, if you want to see something like that, please support the creator on patreon https://alekeagle.com/patreon'
                                    }
                                }).then(() => {
                                    setTimeout(() => {
                                        this.message.edit({
                                            embed: {
                                                title: 'Let\'s play Monopoly!',
                                                color: parseInt('00ff00', 16),
                                                description: 'To join, react with the 🚪!\nTo start, the creator of the game needs to react with ▶\nTo cancel the game, the creator of the game needs to react with ▶\nTo leave, react with 🔚',
                                                fields: [{
                                                    name: 'Players',
                                                    value: `**1.** <@${this.players[0].id}>\n**2.** ${this.players[1] ? `<@${this.players[1].id}>` : 'Empty Slot'}\n**3.** ${this.players[2] ? `<@${this.players[2].id}>` : 'Empty Slot'}\n**4.** ${this.players[3] ? `<@${this.players[3].id}>` : 'Empty Slot'}`
                                                }]
                                            }
                                        });
                                    }, 8000);
                                });
                            } else {
                                this.start();
                            }
                        }
                    } else if (emoji.name === '🔚') {
                        if (this.players.filter(p => p.id === reactor.id)[0] && message.author.id !== user) {
                            this.removePlayer(reactor);
                            this.message.edit({
                                embed: {
                                    title: 'Let\'s play Monopoly!',
                                    color: parseInt('00ff00', 16),
                                    description: 'To join, react with the 🚪!\nTo start, the creator of the game needs to react with ▶\nTo cancel the game, the creator of the game needs to react with ▶\nTo leave, react with 🔚 or remove your reaction to the 🚪',
                                    fields: [{
                                        name: 'Players',
                                        value: `**1.** <@${this.players[0].id}>\n**2.** ${this.players[1] ? `<@${this.players[1].id}>` : 'Empty Slot'}\n**3.** ${this.players[2] ? `<@${this.players[2].id}>` : 'Empty Slot'}\n**4.** ${this.players[3] ? `<@${this.players[3].id}>` : 'Empty Slot'}`
                                    }]
                                }
                            });
                        } else reactor.getDMChannel().then(chnl => {
                            chnl.createMessage({
                                embed: {
                                    color: parseInt('ff0000', 16),
                                    title: 'Error',
                                    description: 'You can\'t leave a game you own!'
                                }
                            });
                        });
                    }
                    this.message.removeReaction(emoji.name, reactor.id);
                }
            }
            this.client.on('messageReactionAdd', this.reactionAddStart);
        });
    }

    addPlayer(player) {
        if (!this.active) {
            let newPlayer = {
                ...player,
                money: 1500,
                currentLocation: 0,
                noJailCards: 0,
                debtMode: false,
                hasMortgages: false,
                doublesInRow: 0,
                inDebtTo: null,
                inDebtBy: 0
            }
            this.players.push(newPlayer);
            this.previousPlayer = this.players.length - 1;
            player.getDMChannel().then(chnl => {
                chnl.createMessage({
                    embed: {
                        color: parseInt('00ff00', 16),
                        title: 'You joined the game!',
                        description: 'quick start instructions can be found here: [MonopolyBot Instructions](https://alekeagle.com/monopolybot/instructions)'
                    }
                });
            }).catch(err => {
                console.error(err);
                this.channel.createMessage(`I couldn't DM <@${player.id}> the instructions, please allow DM's and rejoin the game for instructions.`)
            });
        }
    }

    defaultReactions() {
        this.message.addReaction('🔚').then(() => this.message.addReaction('🎲').then(() => this.message.addReaction('📧').then(() => this.message.addReaction('bankrupt:593118614031171586').then(() => this.message.addReaction('💳').then(() => this.message.addReaction('ℹ').then(() => this.message.addReaction('🏦')))))));
    }

    start() {
        this.active = true;
        this.client.off('messageReactionAdd', this.reactionAddStart);
        this.message.removeReactions().then(() => this.defaultReactions());
        this.message.edit({
            content: `<@${this.players[this.currentPlayer].id}>`,
            embed: {
                title: 'Monopoly',
                color: parseInt('36393E', 16),
                description: 'And we begin! Everyone starts at GO with $1500',
                fields: [{
                        name: 'Players',
                        value: `Up now: <@${this.players[this.currentPlayer].id}>\nUp next: <@${this.players[this.nextPlayer].id}>`
                    },
                    {
                        name: `${this.players[this.currentPlayer].username}#${this.players[this.currentPlayer].discriminator}'s Money`,
                        value: this.players[this.currentPlayer].money
                    }
                ]

            }
        });
        this.reactionAddGame = (mes, emoji, user) => {
            let reactor = mes.channel.guild.members.get(user).user;
            if (this.message.id === mes.id && !reactor.bot) {
                switch (emoji.name) {
                    case '🔚':
                        if (this.players.filter(p => p.id === reactor.id)[0]) {
                            this.removePlayer(reactor);
                            this.message.removeReaction('🔚', reactor.id);
                        } else reactor.getDMChannel().then(chnl => {
                            chnl.createMessage({
                                embed: {
                                    color: parseInt('ff0000', 16),
                                    title: 'Error',
                                    description: 'You can\'t leave a game that you\'re not in!'
                                }
                            });
                        });
                        break;
                    case '🎲':
                        if (this.players[this.currentPlayer].id === reactor.id && !this.otherAction && !this.moving) {
                            if (!this.players[this.currentPlayer].debtMode) {
                                this.moving = true;
                                this.movePlayer();
                            }else {
                                let messageDescription = this.channel.messages.get(this.message.id).embeds[0].description;
                                this.message.edit({
                                    embed: {
                                        title: 'Monopoly',
                                        color: parseInt('ffff00', 16),
                                        description: 'You can\'t move when you are in debt!'
                                    }
                                }).then(() => {
                                    setTimeout(() => {
                                        this.message.edit({
                                            embed: {
                                                title: 'Monopoly',
                                                color: parseInt('36393E', 16),
                                                description: messageDescription,
                                                fields: [{
                                                        name: 'Players',
                                                        value: `Up now: <@${this.players[this.currentPlayer].id}>\nUp next: <@${this.players[this.nextPlayer].id}>`
                                                    },
                                                    {
                                                        name: `${this.players[this.currentPlayer].username}#${this.players[this.currentPlayer].discriminator}'s Money`,
                                                        value: this.players[this.currentPlayer].money
                                                    }
                                                ]
                                            }
                                        });
                                    }, 8000);
                                });
                            }
                        }
                        break;
                    case '📧':
                        if (this.players[this.currentPlayer].id === reactor.id && !this.otherAction && !this.moving) {
                            this.handleTrading();
                        }
                        break;
                    case 'bankrupt':
                        if (this.players[this.currentPlayer].id === reactor.id && !this.otherAction && !this.moving) {
                            if (!this.players[this.currentPlayer].debtMode) {
                                let messageDescription = this.channel.messages.get(this.message.id).embeds[0].description;
                                this.message.edit({
                                    embed: {
                                        title: 'Monopoly',
                                        color: parseInt('ffff00', 16),
                                        description: 'You can\'t file for bankruptcy if you don\'t need to!'
                                    }
                                }).then(() => {
                                    setTimeout(() => {
                                        this.message.edit({
                                            embed: {
                                                title: 'Monopoly',
                                                color: parseInt('36393E', 16),
                                                description: messageDescription,
                                                fields: [{
                                                        name: 'Players',
                                                        value: `Up now: <@${this.players[this.currentPlayer].id}>\nUp next: <@${this.players[this.nextPlayer].id}>`
                                                    },
                                                    {
                                                        name: `${this.players[this.currentPlayer].username}#${this.players[this.currentPlayer].discriminator}'s Money`,
                                                        value: this.players[this.currentPlayer].money
                                                    }
                                                ]
                                            }
                                        });
                                    }, 8000);
                                });
                            } else {
                                this.handleAuction(this.map.filter(p => p.ownedBy === this.players[this.currentPlayer].id), 'bank');
                            }
                        }
                        break;
                    case 'ℹ':
                        if (this.players.filter(p => p.id === reactor.id)[0]) {
                            let thisPlayer = this.players.filter(p => p.id === reactor.id)[0]
                            reactor.getDMChannel().then(chnl => {
                                chnl.createMessage({
                                    embed: {
                                        color: parseInt('00ff00', 16),
                                        title: 'Monopoly Player Stats',
                                        fields: [{
                                                name: 'Money',
                                                value: thisPlayer.money,
                                                inline: true
                                            },
                                            {
                                                name: 'Properties Owned',
                                                value: this.map.filter(m => m.ownedBy === thisPlayer.id).length.toString(),
                                                inline: true
                                            },
                                            {
                                                name: 'Properties Mortgaged',
                                                value: this.map.filter(m => m.ownedBy === thisPlayer.id && m.mortgaged).length.toString(),
                                                inline: true
                                            },
                                            {
                                                name: 'List of Properties Owned',
                                                value: this.map.filter(m => m.ownedBy === thisPlayer.id).map(m => m.name).join('\n') === '' ? 'None' : this.map.filter(m => m.ownedBy === thisPlayer.id).map(m => m.name).join('\n')
                                            },
                                            {
                                                name: 'List of Properties Mortgaged',
                                                value: this.map.filter(m => m.ownedBy === thisPlayer.id && m.mortgaged).map(m => m.name).join('\n') === '' ? 'None' : this.map.filter(m => m.ownedBy === thisPlayer.id && m.mortgaged).map(m => m.name).join('\n')
                                            }
                                        ]
                                    }
                                });
                            });
                        } else {
                            reactor.getDMChannel().then(chnl => {
                                chnl.createMessage({
                                    embed: {
                                        color: parseInt('ff0000', 16),
                                        title: 'Error',
                                        description: 'You can\'t get player stats for yourself if you aren\'t in the game!'
                                    }
                                });
                            });
                        }
                        break;
                    case '💳':
                        if (this.players[this.currentPlayer].id === reactor.id && !this.otherAction && !this.moving) {
                            this.handleMortgaging('menu');
                        }
                        break;
                    case '🏦':
                        if (this.players[this.currentPlayer].id === reactor.id && !this.otherAction && !this.moving) {
                            this.handleBuyingSellingHousing();
                        }
                    break;
                    case '💸':
                        if (this.players[this.currentPlayer].id === reactor.id && !this.otherAction && !this.moving) {
                            if (this.players[this.currentPlayer].debtMode) {
                                if (this.players[this.currentPlayer].money > this.players[this.currentPlayer].inDebtBy) {
                                    if (this.players[this.currentPlayer].inDebtTo === 'bank') {
                                        this.players[this.currentPlayer].money -= this.players[this.currentPlayer].inDebtBy;
                                        this.players[this.currentPlayer].inDebtTo = null;
                                        this.players[this.currentPlayer].inDebtBy = 0;
                                        this.players[this.currentPlayer].debtMode = false;
                                        this.advancePlayer();
                                        this.returnToReadyState('{{previoususer}} just paid off his debt to the bank.\n it is now {{currentuser}}\'s turn!')
                                    }
                                }
                            }
                        }
                }
                this.message.removeReaction(emoji.name === 'bankrupt' ? `${emoji.name}:${emoji.id}` : emoji.name, reactor.id);
            }
        }
        this.client.on('messageReactionAdd', this.reactionAddGame);
    }

    returnToReadyState(readyStateMessage) {
        this.moving = false;
        if (this.players[this.currentPlayer].money < 1) this.handleDebt();
        this.otherAction = false;
        if (this.players[this.currentPlayer].debtMode) {
            this.message.addReaction('💸')
        } else {
            this.message.removeReaction('💸');
        }
        this.message.edit({
            content: `<@${this.players[this.currentPlayer].id}>`,
            embed: {
                title: 'Monopoly',
                color: parseInt('36393E', 16),
                description: `${readyStateMessage.replace(/{{previoususer}}/g, `<@${this.players[this.previousPlayer].id}>`).replace(/{{currentuser}}/g, `<@${this.players[this.currentPlayer].id}>`).replace(/{{nextuser}}/g, `<@${this.players[this.nextPlayer].id}>`)}${this.players[this.currentPlayer].currentLocation === 'jail' ? `\n<@${this.players[this.currentPlayer].id}> Is currently in jail! To get out of jail you must roll doubles!` : ''}`,
                fields: [{
                        name: 'Players',
                        value: `Up now: <@${this.players[this.currentPlayer].id}>\nUp next: <@${this.players[this.nextPlayer].id}>`
                    },
                    {
                        name: `${this.players[this.currentPlayer].username}#${this.players[this.currentPlayer].discriminator}'s Money`,
                        value: this.players[this.currentPlayer].money
                    }
                ]
            }
        });
    }

    end() {
        if (!this.active) {
            this.client.off('messageReactionAdd', this.reactionAddStart);
        } else this.client.off('messageReactionAdd', this.reactionAddGame);
        this.channel = null;
        this.server = null;
        this.players = null;
        this.active = null;
        this.emit('end');
    }

    movePlayer(moveTo) {
        let die1, die2;
        if (moveTo) {
            die1 = moveTo / 2;
            die2 = moveTo / 2;
        } else {
            this.message.edit({
                content: `<@${this.players[this.currentPlayer].id}>`,
                embed: {
                    title: 'Monopoly',
                    color: parseInt('36393E', 16),
                    description: 'Rolling the dice..',
                    fields: [{
                        name: `${this.players[this.currentPlayer].username}#${this.players[this.currentPlayer].discriminator}'s Money`,
                        value: this.players[this.currentPlayer].money
                    }]
                }
            }).then(() => {
                die1 = random(1, 6);
                die2 = random(1, 6);
                
                setTimeout(() => {
                    if (this.players[this.currentPlayer].currentLocation === 'jail') {
                        if (die1 === die2) {
                            this.players[this.currentPlayer].currentLocation = 10;
                            this.advancePlayer();
                            this.returnToReadyState('{{previoususer}} got out of jail, while they\'re waiting for their turn, they\'re taking a nice stroll around jail!\nIt\'s {{currentuser}}\'s turn now!');
                        }else {
                            this.advancePlayer();
                            this.returnToReadyState('Its not {{previoususer}}\'s lucky day becuase they are still in jail!\nIt\'s {{currentuser}}\'s turn now!');
                        }
                    }else {
                        this.message.edit({
                            content: `<@${this.players[this.currentPlayer].id}>`,
                            embed: {
                                title: 'Monopoly',
                                color: parseInt('36393E', 16),
                                description: 'Moving..',
                                fields: [{
                                        name: `${this.players[this.currentPlayer].username}#${this.players[this.currentPlayer].discriminator}'s Money`,
                                        value: this.players[this.currentPlayer].money
                                    },
                                    {
                                        name: 'Die 1',
                                        value: die1
                                    },
                                    {
                                        name: 'Die 2',
                                        value: die2
                                    }
                                ]
                            }
                        }).then(() => {
                            setTimeout(() => {
                                if (this.players[this.currentPlayer].currentLocation !== 'jail' && !this.players[this.currentPlayer].debtMode) {
                                    if (die1 === die2) {
                                        if (++ this.players[this.currentPlayer].doublesInRow < 2) {
                                            this.players[this.currentPlayer].doublesInRow = 0;
                                            this.players[this.currentPlayer].currentLocation = 'jail';
                                            this.advancePlayer();
                                            this.returnToReadyState('{{previoususer}} is now under arrest for suspicion of cheating, that\'ll teach them to rig the dice to roll too many doubles!\nIt\'s {{currentuser}}\'s turn now!')
                                        }
                                    }else {
                                        this.players[this.currentPlayer].doublesInRow = 0;
                                        this.players[this.currentPlayer].currentLocation++
                                        for (let i = 0; i <= (die1 + die2); i++) {
                                            if (i < (die1 + die2)) {
                                                if (this.players[this.currentPlayer].currentLocation === 38) this.players[this.currentPlayer].currentLocation = 0;
                                                if (this.map[this.players[this.currentPlayer].currentLocation].type === 'special') this.handleSpecialMapLocation(this.map[this.players[this.currentPlayer].currentLocation], 'pass', die1, die2);
                                            } else {
                                                if (-- this.players[this.currentPlayer].currentLocation === -1) this.players[this.currentPlayer].currentLocation = this.map.length - 1;
                                                if (this.map[this.players[this.currentPlayer].currentLocation].type === 'special') this.handleSpecialMapLocation(this.map[this.players[this.currentPlayer].currentLocation], 'land', die1, die2);
                                                else this.handleMapLocation(this.map[this.players[this.currentPlayer].currentLocation], die1, die2);
                                            }
                                            if (i < (die1 + die2)) {
                                                if (++this.players[this.currentPlayer].currentLocation === this.map.length) this.players[this.currentPlayer].currentLocation = 0;
                                            }
                                        }
                                    }
                                }
                            }, 2000);
                        });
                    }
                }, 2000);
            });
        }
    }

    handleSpecialMapLocation(location, type, die1, die2) {
        if (type === 'pass') {
            if (typeof location.actions.pass === 'number') {
                this.players[this.currentPlayer].money += location.actions.pass
            };
        } else if (type === 'land') {
            if (typeof location.actions.land === 'number') {
                this.players[this.currentPlayer].money += location.actions.land;
                if (die1 === die2) {
                    this.returnToReadyState(`{{currentuser}} landed on ${location.name} and you ${location.actions.land < 0 ? 'lost' : 'gained'} $${location.actions.land.toString().replace(/-/g, '')}!\nThey also rolled a double, so they go again!`);
                } else {
                    this.advancePlayer();
                    this.returnToReadyState(`{{previoususer}} landed on ${location.name} and you ${location.actions.land < 0 ? 'lost' : 'gained'} $${location.actions.land.toString().replace(/-/g, '')}!\nIt is now {{currentuser}}\'s turn!`);
                }
            } else if (typeof location.actions.land === 'string') {
                switch (location.actions.land) {
                    case 'comchest':
                        let comchest = communityChest[random(0, communityChest.length - 1)]
                        this.handleCards(comchest, 'Community Chest', die1, die2);
                        break;
                    case 'chance':
                        let chancecrd = chance[random(0, chance.length - 1)]
                        this.handleCards(chancecrd, 'Chance Pile', die1, die2);
                        break;
                    case 'tojail':
                        this.players[this.currentPlayer].currentLocation = 'jail';
                        this.advancePlayer();
                        this.returnToReadyState(`{{previoususer}} landed on the "Go to jail space"! They are now in jail!\nIt is now {{currentuser}}\'s turn!`);
                        break;
                    case 'freeparking':
                        if (die1 === die2) {
                            this.returnToReadyState(`{{currentuser}} found one more free spot in the Free Parking lot!\nThey also rolled a double, so they go again!`);
                        } else {
                            this.advancePlayer();
                            this.returnToReadyState(`{{previoususer}} found one more free spot in the Free Parking lot!\nIt is now {{currentuser}}\'s turn!`);
                        }
                        break;
                    case 'visitingjail':
                        if (die1 === die2) {
                            this.returnToReadyState(`{{currentuser}} decided he might want to purchase the jail, so he paid it a visit! (he wasn't intrested)\nThey also rolled a double, so they go again!`);
                        } else {
                            this.advancePlayer();
                            this.returnToReadyState(`{{previoususer}} decided he might want to purchase the jail, so he paid it a visit! (he wasn't intrested)\nIt is now {{currentuser}}\'s turn!`);
                        }
                        break;
                }
                return;
            }
        }
    }

    handleMapLocation(location, die1, die2) {
        if (location.ownedBy && location.ownedBy === this.players[this.currentPlayer].id) {
            if (die1 === die2) {
                this.returnToReadyState(`{{currentuser}} landed on their own property ${location.name}!\nThey also rolled a double, so they go again!`);
            } else {
                this.advancePlayer();
                this.returnToReadyState(`{{previoususer}} landed on their own property ${location.name}!\nIt is now {{currentuser}}\'s turn!`);
            }
        } else if (location.ownedBy && location.ownedBy !== this.players[this.currentPlayer].id) {
            this.handleRent(location, die1, die2);
        } else if (!location.ownedBy) {
            this.handlePurchase(location, die1, die2);
        }
    }

    handlePurchase(property, die1, die2) {
        this.otherAction = true;
        this.message.edit({
            embed: {
                title: 'Monopoly',
                color: parseInt('36393E', 16),
                description: `You landed on ${property.name}, which is not owned. Would you like to purchase it for $${property.price}? Not purchasing it will begin an auction for it.`,
                thumbnail: {
                    url: `https://alekeagle.com/assets/images/${property.color}.png`
                },
                fields: [{
                        name: `${this.players[this.currentPlayer].username}#${this.players[this.currentPlayer].discriminator}'s Money`,
                        value: this.players[this.currentPlayer].money
                    },
                    {
                        name: 'Die 1',
                        value: die1
                    },
                    {
                        name: 'Die 2',
                        value: die2
                    }
                ]
            }
        })
        this.message.addReaction('✅').then(() => this.message.addReaction('❎'));
        this.reactionAddPurchase = (mes, emoji, user) => {
            let reactor = mes.channel.guild.members.get(user).user;
            if (mes.id === this.message.id && !reactor.bot && reactor.id === this.players[this.currentPlayer].id) {
                switch (emoji.name) {
                    case '✅':
                        this.map[this.map.indexOf(property)].ownedBy = this.players[this.currentPlayer].id;
                        this.players[this.currentPlayer].money -= property.price;
                        if (die1 === die2) {
                            this.client.off('messageReactionAdd', this.reactionAddPurchase);
                            this.message.removeReaction('✅').then(() => this.message.removeReaction('❎'));
                            this.returnToReadyState(`{{currentuser}} landed on ${property.name} and bought it for $${property.price}!\nThey also rolled a double, so they go again!`);
                        } else {
                            this.advancePlayer();
                            this.client.off('messageReactionAdd', this.reactionAddPurchase);
                            this.message.removeReaction('✅').then(() => this.message.removeReaction('❎'));
                            this.returnToReadyState(`{{previoususer}} landed on ${property.name} and bought it for $${property.price}!\nIt is now {{currentuser}}\'s turn!`);
                        }
                        break;
                    case '❎':
                        this.client.off('messageReactionAdd', this.reactionAddPurchase);
                        this.message.removeReaction('✅').then(() => this.message.removeReaction('❎'));
                        let array = [property];
                        this.handleAuction(array, 'user', die1, die2);
                        break;
                }
                this.message.removeReaction(emoji.name === 'bankrupt' ? `${emoji.name}:${emoji.id}` : emoji.name, reactor.id);
            }
        }
        this.client.on('messageReactionAdd', this.reactionAddPurchase);
    }

    handleTrading() {
        let confirmTrade = false;
        let tradablePlayers = this.players.filter(p => p.id !== this.players[this.currentPlayer].id)
        this.otherAction = true;
        let tradingWith;
        let currentDecidingFactor = this.players[this.currentPlayer].id;
        let tradeOffer = {
            money: 0,
            properties: {
                from: [],
                to: []
            }
        };
        let somethingElse = false;
        this.message.removeReactions().then(() => {
            this.message.addReaction('❌');
            if (tradablePlayers.length === 3) {
                this.message.addReaction('1⃣').then(() => this.message.addReaction('2⃣').then(() => this.message.addReaction('3⃣')));
            } else if (tradablePlayers.length === 2) {
                this.message.addReaction('1⃣').then(() => this.message.addReaction('2⃣'));
            } else if (tradablePlayers.length === 1) {
                this.message.addReaction('1⃣');
            }
        })

        this.message.edit({
            embed: {
                title: 'Monopoly',
                color: parseInt('36393E', 16),
                description: 'Trading!',
                fields: [{
                        name: 'People to trade with',
                        value: `1⃣ <@${tradablePlayers[0].id}>${tradablePlayers[1] ? `\n2⃣ <@${tradablePlayers[1].id}>` : ''}${tradablePlayers[2] ? `\n3⃣ <@${tradablePlayers[2].id}>` : ''}`
                    },
                    {
                        name: `${this.players[this.currentPlayer].username}#${this.players[this.currentPlayer].discriminator}'s Money`,
                        value: this.players[this.currentPlayer].money
                    }
                ]
            }
        });
        this.reactionAddTrade = (mes, emoji, user) => {
            let reactor = mes.channel.guild.members.get(user).user;
            this.addAllReactionsTrade = () => {
                this.message.addReaction('❌').then(() => this.message.addReaction('1⃣').then(() => this.message.addReaction('2⃣').then(() => this.message.addReaction('3⃣').then(() => this.message.addReaction('4⃣').then(() => this.message.addReaction('5⃣').then(() => this.message.addReaction('6⃣').then(() => this.message.addReaction('7⃣').then(() => this.message.addReaction('8⃣').then(() => this.message.addReaction('9⃣').then(() => this.message.addReaction('0⃣').then(() => this.message.addReaction('➖').then(() => this.message.addReaction('#⃣').then(() => this.message.addReaction('🏠').then(() => this.message.addReaction('✅')))))))))))))));
            }
            this.editTheMessageTrade = () => {
                this.message.edit({
                    embed: {
                        title: 'Monopoly',
                        color: parseInt('36393E', 16),
                        description: 'Trading!\nUse the numbers to enter the amount of money you want to trade!\nUse the #⃣ emoji to clear the money input!\nUse the ➖ to switch the direction of the money flow!\nUse the 🏠 emoji to select a property to trade!',
                        fields: [{
                                name: `${this.players.filter(p => p.id === tradingWith)[0].username}#${this.players.filter(p => p.id === tradingWith)[0].discriminator}'s Money`,
                                value: this.players.filter(p => p.id === tradingWith)[0].money
                            },
                            {
                                name: `${this.players[this.currentPlayer].username}#${this.players[this.currentPlayer].discriminator}'s Money`,
                                value: this.players[this.currentPlayer].money
                            },
                            {
                                name: 'Money Offer',
                                value: tradeOffer.money.toString().includes('-') ? `$${tradeOffer.money.toString().replace(/-/g, '')} from <@${tradingWith}>` : `$${tradeOffer.money.toString().replace(/-/g, '')} to <@${tradingWith}>`
                            },
                            {
                                name: `Property Offer to ${this.players.filter(p => p.id === tradingWith)[0].username}#${this.players.filter(p => p.id === tradingWith)[0].discriminator}`,
                                value: tradeOffer.properties.to.map(e => e.name)[0] ? tradeOffer.properties.to.map(e => e.name).join('\n') : 'None yet'
                            },
                            {
                                name: `Property Offer from ${this.players.filter(p => p.id === tradingWith)[0].username}#${this.players.filter(p => p.id === tradingWith)[0].discriminator}`,
                                value: tradeOffer.properties.from.map(e => e.name)[0] ? tradeOffer.properties.from.map(e => e.name).join('\n') : 'None yet'
                            }
                        ]
                    }
                });
            }
            if (this.message.id === mes.id && !reactor.bot && !somethingElse) {
                switch (emoji.name) {
                    case '0⃣':
                        if (tradingWith && reactor.id === currentDecidingFactor && !confirmTrade) {
                            tradeOffer.money = parseInt(tradeOffer.money.toString() + '0')
                            this.editTheMessageTrade();
                        }
                        break;
                    case '1⃣':
                        if (tradingWith && reactor.id === currentDecidingFactor && !confirmTrade) {
                            tradeOffer.money = parseInt(tradeOffer.money.toString() + '1')
                            this.editTheMessageTrade();
                        } else if (!confirmTrade) {
                            tradingWith = tradablePlayers[0].id;
                            this.addAllReactionsTrade();
                            this.editTheMessageTrade();
                        }
                        break;
                    case '2⃣':
                        if (tradingWith && reactor.id === currentDecidingFactor && !confirmTrade) {
                            tradeOffer.money = parseInt(tradeOffer.money.toString() + '2')
                            this.editTheMessageTrade();
                        } else if (!confirmTrade) {
                            tradingWith = tradablePlayers[1].id;
                            this.addAllReactionsTrade();
                            this.editTheMessageTrade();
                        }
                        break;
                    case '3⃣':
                        if (tradingWith && reactor.id === currentDecidingFactor && !confirmTrade) {
                            tradeOffer.money = parseInt(tradeOffer.money.toString() + '3')
                            this.editTheMessageTrade();
                        } else if (!confirmTrade) {
                            tradingWith = tradablePlayers[2].id;
                            this.addAllReactionsTrade();
                            this.editTheMessageTrade();
                        }
                        break;
                    case '4⃣':
                        if (tradingWith && reactor.id === currentDecidingFactor && !confirmTrade) {
                            tradeOffer.money = parseInt(tradeOffer.money.toString() + '4')
                            this.editTheMessageTrade();
                        }
                        break;
                    case '5⃣':
                        if (tradingWith && reactor.id === currentDecidingFactor && !confirmTrade) {
                            tradeOffer.money = parseInt(tradeOffer.money.toString() + '5')
                            this.editTheMessageTrade();
                        }
                        break;
                    case '6⃣':
                        if (tradingWith && reactor.id === currentDecidingFactor && !confirmTrade) {
                            tradeOffer.money = parseInt(tradeOffer.money.toString() + '6')
                            this.editTheMessageTrade();
                        }
                        break;
                    case '7⃣':
                        if (tradingWith && reactor.id === currentDecidingFactor && !confirmTrade) {
                            tradeOffer.money = parseInt(tradeOffer.money.toString() + '7')
                            this.editTheMessageTrade();
                        }
                        break;
                    case '8⃣':
                        if (tradingWith && reactor.id === currentDecidingFactor && !confirmTrade) {
                            tradeOffer.money = parseInt(tradeOffer.money.toString() + '8')
                            this.editTheMessageTrade();
                        }
                        break;
                    case '9⃣':
                        if (tradingWith && reactor.id === currentDecidingFactor && !confirmTrade) {
                            tradeOffer.money = parseInt(tradeOffer.money.toString() + '9')
                            this.editTheMessageTrade();
                        }
                        break;
                    case '➖':
                        if (tradingWith && reactor.id === currentDecidingFactor && !confirmTrade) {
                            tradeOffer.money = -(tradeOffer.money);
                            this.editTheMessageTrade();
                        }
                        break;
                    case '#⃣':
                        if (tradingWith && reactor.id === currentDecidingFactor && !confirmTrade) {
                            tradeOffer.money = 0;
                            this.editTheMessageTrade();
                        }
                        break;
                    case '🏠':
                        if (tradingWith && reactor.id === currentDecidingFactor && !confirmTrade) {
                            let selectingProperties = false;
                            let person;
                            let selection = 0;
                            somethingElse = true;
                            this.addAllReactionsTradeProperties1 = () => {
                                this.message.removeReactions().then(() => this.message.addReaction('⬅').then(() => this.message.addReaction('➡')));
                            }
                            this.addAllReactionsTradeProperties2 = () => {
                                this.message.removeReactions().then(() => this.message.addReaction('⬅').then(() => this.message.addReaction('⬆').then(() => this.message.addReaction('⬇').then(() => this.message.addReaction('⏺').then(() => this.message.addReaction('❌'))))));
                            }
                            this.editTheMessageTradeProperties = () => {
                                this.message.edit({
                                    embed: {
                                        title: 'Monopoly',
                                        color: parseInt('36393E', 16),
                                        description: `React with ⬇ ⬆ emojis to cycle up and down thorugh the options.\nReact with the ⏺ emoji to select the property.\nReact with the ⬅ emoji to go back.\nReact with the ❌ emoji to go back to the main trading menu.`,
                                        fields: [{
                                                name: 'List of properties',
                                                value: this.map.filter(e => e.ownedBy === person).map(p => p.name)[0] ? this.map.filter(e => e.ownedBy === person).map(p => p.name).join('\n') : 'This Player has no properties'
                                            },
                                            {
                                                name: 'Selection',
                                                value: this.map.filter(e => e.ownedBy === person).map(p => p.name)[0] ? this.map.filter(e => e.ownedBy === person).map(p => p.name)[selection] : 'This Player has no properties'
                                            }
                                        ]
                                    }
                                })
                            }
                            this.message.edit({
                                embed: {
                                    title: 'Monopoly',
                                    color: parseInt('36393E', 16),
                                    description: `React with ⬅ to select from <@${this.players[this.currentPlayer].id}>'s properties.\nReact with ➡ to select from <@${tradingWith}>'s properties.`
                                }
                            });
                            this.addAllReactionsTradeProperties1();
                            this.reactionAddTradeProperties = (mes, emoji, user) => {
                                let reactor = mes.channel.guild.members.get(user).user;
                                if (reactor.id === currentDecidingFactor && mes.id === this.message.id && !reactor.bot)
                                    switch (emoji.name) {
                                        case '⬅':
                                            if (!selectingProperties) {
                                                selectingProperties = true;
                                                person = this.players[this.currentPlayer].id;
                                                this.editTheMessageTradeProperties();
                                                this.addAllReactionsTradeProperties2();
                                            } else {
                                                selection = 0;
                                                person = null;
                                                this.addAllReactionsTradeProperties1();
                                                this.message.edit({
                                                    embed: {
                                                        title: 'Monopoly',
                                                        color: parseInt('36393E', 16),
                                                        description: `React with ⬅ to select from <@${this.players[this.currentPlayer].id}>'s properties.\nReact with ➡ to select from <@${tradingWith}>'s properties.`
                                                    }
                                                });
                                            }
                                            break;
                                        case '➡':
                                            if (!selectingProperties) {
                                                selectingProperties = true;
                                                person = tradingWith;
                                                this.editTheMessageTradeProperties();
                                                this.addAllReactionsTradeProperties2();
                                            }
                                            break;
                                        case '⬇':
                                            if (++selection === this.map.filter(e => e.ownedBy === person).length) selection = 0;
                                            this.editTheMessageTradeProperties();
                                            break;
                                        case '⬆':
                                            if (--selection === -1) selection = this.map.filter(e => e.ownedBy === person).length - 1;
                                            this.editTheMessageTradeProperties();
                                            break;
                                        case '⏺':
                                            if (person === tradingWith) tradeOffer.properties.from.push(this.map.filter(e => e.ownedBy === person)[selection]);
                                            else if (person === this.players[this.currentPlayer].id) tradeOffer.properties.to.push(this.map.filter(e => e.ownedBy === person)[selection]);
                                            this.message.removeReactions().then(() => this.addAllReactionsTrade());
                                            this.editTheMessageTrade();
                                            somethingElse = false;
                                            this.client.off('messageReactionAdd', this.reactionAddTradeProperties);
                                            break;
                                        case '❌':
                                            somethingElse = false;
                                            this.client.off('messageReactionAdd', this.reactionAddTradeProperties);
                                            this.editTheMessageTrade();
                                            this.message.removeReactions().then(() => this.addAllReactionsTrade());
                                    }
                            }
                            this.client.on('messageReactionAdd', this.reactionAddTradeProperties);
                        }
                        break;
                    case '❌':
                        if (reactor.id === currentDecidingFactor && !somethingElse) {
                            this.client.off('messageReactionAdd', this.reactionAddTrade);
                            this.message.removeReactions().then(() => this.defaultReactions());
                            this.returnToReadyState('Trade canceled!');
                        }
                        break;
                    case '✅':
                        if (reactor.id === currentDecidingFactor && !confirmTrade) {
                            confirmTrade = true;
                            this.message.edit({
                                embed: {
                                    title: 'Monopoly',
                                    color: parseInt('36393E', 16),
                                    description: `Please confirm the trade <@${tradingWith}>, otherwise react with the X.\nUse the numbers to enter the amount of money you want to trade!\nUse the #⃣ emoji to clear the money input!\nUse the ➖ to switch the direction of the money flow!\nUse the 🏠 emoji to select a property to trade!`,
                                    fields: [{
                                            name: `${this.players.filter(p => p.id === tradingWith)[0].username}#${this.players.filter(p => p.id === tradingWith)[0].discriminator}'s Money`,
                                            value: this.players.filter(p => p.id === tradingWith)[0].money
                                        },
                                        {
                                            name: `${this.players[this.currentPlayer].username}#${this.players[this.currentPlayer].discriminator}'s Money`,
                                            value: this.players[this.currentPlayer].money
                                        },
                                        {
                                            name: 'Money Offer',
                                            value: tradeOffer.money.toString().includes('-') ? `$${tradeOffer.money.toString().replace(/-/g, '')} from <@${tradingWith}>` : `$${tradeOffer.money.toString().replace(/-/g, '')} to <@${tradingWith}>`
                                        },
                                        {
                                            name: `Property Offer to ${this.players.filter(p => p.id === tradingWith)[0].username}#${this.players.filter(p => p.id === tradingWith)[0].discriminator}`,
                                            value: tradeOffer.properties.to.map(e => e.name)[0] ? tradeOffer.properties.to.map(e => e.name).join('\n') : 'None yet'
                                        },
                                        {
                                            name: `Property Offer from ${this.players.filter(p => p.id === tradingWith)[0].username}#${this.players.filter(p => p.id === tradingWith)[0].discriminator}`,
                                            value: tradeOffer.properties.from.map(e => e.name)[0] ? tradeOffer.properties.from.map(e => e.name).join('\n') : 'None yet'
                                        }
                                    ]
                                }
                            });
                        } else if (confirmTrade) {
                            if (this.players[this.currentPlayer].inDebtTo === tradingWith) {
                                this.players[this.currentPlayer].debtMode = false;
                                this.players[this.currentPlayer].inDebtTo = null;
                                this.players[this.currentPlayer].inDebtBy = 0;
                            }
                            this.players[this.currentPlayer].money -= tradeOffer.money;
                            this.players[this.players.indexOf(this.players.filter(p => p.id === tradingWith)[0])].money += tradeOffer.money;
                            tradeOffer.properties.to.forEach(p => {
                                this.map[this.map.indexOf(p)].ownedBy = tradingWith;
                            })
                            tradeOffer.properties.from.forEach(p => {
                                this.map[this.map.indexOf(p)].ownedBy = this.players[this.currentPlayer].id;
                            })
                            this.client.off('messageReactionAdd', this.reactionAddTrade);
                            this.message.removeReactions().then(() => this.defaultReactions());
                            this.returnToReadyState('Trade Complete!');
                        }
                        break;
                }
            }
        }
        this.client.on('messageReactionAdd', this.reactionAddTrade);
    }

    handleDebt(inDebtTo, inDebtBy) {
        this.players[this.currentPlayer].debtMode = true;
        this.players[this.currentPlayer].inDebtTo = inDebtTo || this.players[this.currentPlayer].inDebtTo;
        this.players[this.currentPlayer].inDebtBy = inDebtBy || this.players[this.currentPlayer].inDebtBy;
        this.message.edit({
            content: `<@${this.players[this.currentPlayer].id}>`,
            embed: {
                title: 'Monopoly',
                color: parseInt('36393E', 16),
                description: `<@${this.players[this.currentPlayer].id}> tried to pay <@${this.players[this.currentPlayer].inDebtTo}> $${this.players[this.currentPlayer].inDebtBy} but was unable to. You are now in debt! To get out of debt, you must do one of the following:\nMake a successful trade with the player you're in debt with.\nMortgage properties until you have enough money.\nSell houses and hotels until you have enough money.`,
                fields: [{
                        name: 'Players',
                        value: `Up now: <@${this.players[this.currentPlayer].id}>\nUp next: <@${this.players[this.nextPlayer].id}>`
                    },
                    {
                        name: `${this.players[this.currentPlayer].username}#${this.players[this.currentPlayer].discriminator}'s Money`,
                        value: this.players[this.currentPlayer].money
                    }
                ]
            }
        })
    }

    handleBuyingSellingHousing() {
        let submenu = false;
        let selection = 0;
        let type;
        this.otherAction = true;
        this.message.edit({
            embed: {
                title: 'Monopoly',
                color: parseInt('36393E', 16),
                description: 'Buying and Selling Houses and Hotels\nTo view all your properties that are eligible for building houses and hotels on, react with the 🏡 emoji.\nTo view already built houses and hotels, react with the 🏚 emoji.'
            }
        });
        this.addAllReactionsHousing = () => {
            this.message.addReaction('❌').then(() => this.message.addReaction('🏡').then(() => this.message.addReaction('🏚')))
        }
        this.editTheMessageHousing = () => {
            this.message.edit({
                embed: {
                    title: 'Monopoly',
                    color: parseInt('36393E', 16),
                    description: `These are the properties that are eligible to have houses/hotels ${type === 'buy' ? 'bought' : 'sold'}.\nReact with ⬇ ⬆ emojis to cycle up and down thorugh the options.\nReact with the ⏺ emoji to ${type === 'buy' ? 'buy' : 'sell'} houses/hotels on the selected property.\nReact with the ❌ emoji to go back to the main Buying and Selling Houses and Hotels menu.`,
                    fields: [
                        {
                            name: 'List of properties',
                            value: this.map.filter(p => this.map.filter(m => m.color === p.color).length === this.map.filter(m => m.color === p.color && m.ownedBy === this.players[this.currentPlayer].id).length && p.ownedBy === this.players[this.currentPlayer].id && (type === 'buy' ? p.houses < 4 : p.houses > 0))[0] ? this.map.filter(p => this.map.filter(m => m.color === p.color).length === this.map.filter(m => m.color === p.color && m.ownedBy === this.players[this.currentPlayer].id).length && p.ownedBy === this.players[this.currentPlayer].id && (type === 'buy' ? p.houses < 4 : p.houses > 0)).join('\n') : 'None yet'
                        },
                        {
                            name: 'Selection',
                            value: this.map.filter(p => this.map.filter(m => m.color === p.color).length === this.map.filter(m => m.color === p.color && m.ownedBy === this.players[this.currentPlayer].id).length && p.ownedBy === this.players[this.currentPlayer].id && (type === 'buy' ? p.houses < 4 : p.houses > 0))[0] ? this.map.filter(p => this.map.filter(m => m.color === p.color).length === this.map.filter(m => m.color === p.color && m.ownedBy === this.players[this.currentPlayer].id).length && p.ownedBy === this.players[this.currentPlayer].id && (type === 'buy' ? p.houses < 4 : p.houses > 0)).map(e => e.name)[selection] : 'None yet'
                        }
                    ]
                }
            });
        }
        this.addAllReactionsHousing1 = () => {
            this.message.addReaction('❌').then(() => this.message.addReaction('⬇').then(() => this.message.addReaction('⬆').then(() => this.message.addReaction('⏺'))));
        }
        this.message.removeReactions().then(() => this.addAllReactionsHousing());
        this.reactionAddHousing = (mes, emoji, user) => {
            let reactor = mes.channel.guild.members.get(user).user;
            if (this.players[this.currentPlayer].id === reactor.id && !reactor.bot) {
                switch(emoji.name) {
                    case '🏡':
                        type = 'buy';
                        submenu = true;
                        this.editTheMessageHousing();
                        this.message.removeReactions().then(() => this.addAllReactionsHousing1());
                    break;
                    case '🏚':
                        type = 'sell';
                        submenu = true;
                        this.editTheMessageHousing();
                        this.message.removeReactions().then(() => this.addAllReactionsHousing1());
                    break;
                    case '⬇':
                        if (submenu) {
                            if (++selection === this.map.filter(p => this.map.filter(m => m.color === p.color).length === this.map.filter(m => m.color === p.color && m.ownedBy === this.players[this.currentPlayer].id).length && p.ownedBy === this.players[this.currentPlayer].id && (type === 'buy' ? p.houses < 4 : p.houses > 0)).length) selection = 0;
                            this.editTheMessageHousing();
                        }
                        break;
                    case '⬆':
                        if (submenu) {
                            if (--selection === -1) selection = this.map.filter(p => this.map.filter(m => m.color === p.color).length === this.map.filter(m => m.color === p.color && m.ownedBy === this.players[this.currentPlayer].id).length && p.ownedBy === this.players[this.currentPlayer].id && (type === 'buy' ? p.houses < 4 : p.houses > 0)).length - 1;
                            this.editTheMessageHousing();
                        }
                        break;
                    case '⏺':
                        if (type === 'buy') {
                            this.players[this.currentPlayer].money -= housePricing[this.map.filter(p => this.map.filter(m => m.color === p.color).length === this.map.filter(m => m.color === p.color && m.ownedBy === this.players[this.currentPlayer].id).length && p.ownedBy === this.players[this.currentPlayer].id && (type === 'buy' ? p.houses < 4 : p.houses > 0))[selection].color];
                        }else  {
                            this.players[this.currentPlayer].money += housePricing[this.map.filter(p => this.map.filter(m => m.color === p.color).length === this.map.filter(m => m.color === p.color && m.ownedBy === this.players[this.currentPlayer].id).length && p.ownedBy === this.players[this.currentPlayer].id && (type === 'buy' ? p.houses < 4 : p.houses > 0))[selection].color] / 2;
                        }
                        this.message.removeReactions().then(() => this.addAllReactionsHousing());
                        this.message.edit({
                            embed: {
                                title: 'Monopoly',
                                color: parseInt('36393E', 16),
                                description: 'Buying and Selling Houses and Hotels\nTo view all your properties that are eligible for building houses and hotels on, react with the 🏡 emoji.\nTo view already built houses and hotels, react with the 🏚 emoji.'
                            }
                        });
                        submenu = false;
                        break;
                    case '❌':
                        if (submenu) {
                            submenu = false;
                            this.message.edit({
                                embed: {
                                    title: 'Monopoly',
                                    color: parseInt('36393E', 16),
                                    description: 'Buying and Selling Houses and Hotels\nTo view all your properties that are eligible for building houses and hotels on, react with the 🏡 emoji.\nTo view already built houses and hotels, react with the 🏚 emoji.'
                                }
                            });
                            this.message.removeReactions().then(() => this.addAllReactionsHousing());
                        }else {
                            this.client.off('messageReactionAdd', this.reactionAddHousing);
                            this.message.removeReactions().then(() => this.defaultReactions());
                            this.returnToReadyState('Done managing houses/hotels!');
                        }
                        break;
                }
            }
        }
        this.client.on('messageReactionAdd', this.reactionAddHousing);
    }

    handleMortgaging(type) {
        let submenu = false;
        let selection = 0;
        let otherType;
        switch(type) {
            case 'menu':
                this.otherAction = true;
                this.message.edit({
                    embed: {
                        title: 'Monopoly',
                        color: parseInt('36393E', 16),
                        description: 'Mortgaging Menu\nTo view all of your currently mortgaged properties, react with the 🏦 emoji.\nTo view properties without a mortgage, react with the 🏠 emoji.'
                    }
                });
                this.addAllReactionsMortgaging = () => {
                    this.message.addReaction('❌').then(() => this.message.addReaction('🏦').then(() => this.message.addReaction('🏠')));
                }
                this.editTheMessageMortgaging = () => {
                    this.message.edit({
                        embed: {
                            title: 'Monopoly',
                            color: parseInt('36393E', 16),
                            description: `These are the properties that are ${otherType === 'mortgaged' ? '' : 'not '}mortgaged.\nReact with ⬇ ⬆ emojis to cycle up and down thorugh the options.\nReact with the ⏺ emoji to ${otherType === 'mortgaged' ? 'pay off' : 'mortgage'} the selected property.\nReact with the ❌ emoji to go back to the main mortgaging menu.`,
                            fields: [
                                {
                                    name: 'List of properties',
                                    value: this.map.filter(p => p.ownedBy === this.players[this.currentPlayer].id && (otherType === 'mortgaged' ? p.mortgaged : !p.mortgaged))[0] ? this.map.filter(p => p.ownedBy === this.players[this.currentPlayer].id && (otherType === 'mortgaged' ? p.mortgaged : !p.mortgaged)).map(p => `${p.name} | ${otherType === 'mortgaged' ? 'owed:' : 'mortgage for:'} $${otherType === 'mortgaged' ? p.mortgage * 1.1 : p.mortgage}`).join('\n') : 'None yet'
                                },
                                {
                                    name: 'Selection',
                                    value: this.map.filter(p => p.ownedBy === this.players[this.currentPlayer].id && (otherType === 'mortgaged' ? p.mortgaged : !p.mortgaged))[0] ? this.map.filter(p => p.ownedBy === this.players[this.currentPlayer].id && (otherType === 'mortgaged' ? p.mortgaged : !p.mortgaged)).map(p => `${p.name} | ${otherType === 'mortgaged' ? 'owed:' : 'mortgage for:'} $${otherType === 'mortgaged' ? p.mortgage * 1.1 : p.mortgage}`)[selection] : 'None yet'
                                }
                            ]
                        }
                    })
                }
                this.message.removeReactions().then(() => this.addAllReactionsMortgaging());
                this.addAllReactionsMortgaging1 = () => {
                    this.message.addReaction('❌').then(() => this.message.addReaction('⬇').then(() => this.message.addReaction('⬆').then(() => this.message.addReaction('⏺'))))
                }
                this.reactionAddMortgaging = (mes, emoji, user) => {
                    let reactor = mes.channel.guild.members.get(user).user;
                    if (this.players[this.currentPlayer].id === reactor.id && !reactor.bot) {
                        switch(emoji.name) {
                            case '🏦':
                                if (!submenu) {
                                    submenu = true;
                                    otherType = 'mortgaged';
                                    this.message.removeReactions().then(() => this.addAllReactionsMortgaging1());
                                    this.editTheMessageMortgaging();
                                }
                            break;
                            case '🏠':
                                if (!submenu) {
                                    submenu = true;
                                    otherType = 'notmortgaged';
                                    this.message.removeReactions().then(() => this.addAllReactionsMortgaging1());
                                    this.editTheMessageMortgaging();
                                }
                            break;
                            case '⬇':
                                if (submenu) {
                                    if (++selection === this.map.filter(e => e.ownedBy === this.players[this.currentPlayer].id && (otherType === 'mortgaged' ? e.mortgaged : !e.mortgaged)).length) selection = 0;
                                    this.editTheMessageMortgaging();
                                }
                                break;
                            case '⬆':
                                if (submenu) {
                                    if (--selection === -1) selection = this.map.filter(e => e.ownedBy === this.players[this.currentPlayer].id && (otherType === 'mortgaged' ? e.mortgaged : !e.mortgaged)).length - 1;
                                    this.editTheMessageMortgaging();
                                }
                                break;
                            case '⏺':
                                if (otherType === 'mortgaged') {
                                    let thisProperty = this.map.indexOf(this.map.filter(e => e.ownedBy === this.players[this.currentPlayer].id && (otherType === 'mortgaged' ? e.mortgaged : !e.mortgaged))[selection]);
                                    this.map[thisProperty].mortgaged = false;
                                    this.players[this.currentPlayer].money -= this.map[thisProperty].mortgage * 1.1;
                                }else {
                                    let thisProperty = this.map.indexOf(this.map.filter(e => e.ownedBy === this.players[this.currentPlayer].id && (otherType === 'mortgaged' ? e.mortgaged : !e.mortgaged))[selection]);
                                    this.map[thisProperty].mortgaged = true;
                                    this.players[this.currentPlayer].money += this.map[thisProperty].mortgage;
                                }
                                this.message.removeReactions().then(() => this.addAllReactionsMortgaging());
                                this.message.edit({
                                    embed: {
                                        title: 'Monopoly',
                                        color: parseInt('36393E', 16),
                                        description: 'Mortgaging Menu\nTo view all of your currently mortgaged properties, react with the 🏦 emoji.\nTo view properties without a mortgage, react with the 🏠 emoji.'
                                    }
                                });
                                submenu = false;
                                break;
                            case '❌':
                                if (submenu) {
                                    submenu = false;
                                    this.message.edit({
                                        embed: {
                                            title: 'Monopoly',
                                            color: parseInt('36393E', 16),
                                            description: 'Mortgaging Menu\nTo view all of your currently mortgaged properties, react with the 🏦 emoji.\nTo view properties without a mortgage, react with the 🏠 emoji.'
                                        }
                                    });
                                    this.message.removeReactions().then(() => this.addAllReactionsMortgaging());
                                }else {
                                    this.client.off('messageReactionAdd', this.reactionAddMortgaging);
                                    this.message.removeReactions().then(() => this.defaultReactions());
                                    this.returnToReadyState('Done managing mortgages!');
                                }
                        }
                    }
                }
                this.client.on('messageReactionAdd', this.reactionAddMortgaging);
            break;
        }
    }

    handleAuction(properties, auctionType, die1, die2) {
        this.message.addReaction('🆙');
        for (let i = 0; i <= properties.length; i++) {
            let p = properties[0]
            if (i < properties.length) {
                let highestBidder, currentPrice, timeout1, timeout2, timeout3;
                currentPrice = p.price - 100;
                this.message.edit({
                    embed: {
                        color: parseInt('36393E', 16),
                        title: 'Monopoly',
                        description: 'We got a couple of properties that are up for auction. To increase your bidding amount, hit the 🆙 reaction.',
                        fields: [{
                                name: 'Property up now',
                                value: p.name,
                                inline: true
                            },
                            {
                                name: 'Current price',
                                value: currentPrice + 100,
                                inline: true
                            },
                            {
                                name: 'Current Highest Bidder',
                                value: highestBidder ? `<@${highestBidder}>` : 'None',
                                inline: true
                            }
                        ]
                    }
                })
                this.reactionAddAuction = (mes, emoji, user) => {
                    let reactor = mes.channel.guild.members.get(user).user;
                    if (this.players.filter(l => l.id === reactor.id && (auctionType === 'user' ? l.id !== this.players[this.currentPlayer].id : true))[0]) {
                        switch (emoji.name) {
                            case '🆙':
                                clearTimeout(timeout1);
                                clearTimeout(timeout2);
                                clearTimeout(timeout3);
                                timeout1 = null;
                                timeout2 = null;
                                timeout3 = null;
                                highestBidder = reactor.id
                                currentPrice += 100
                                this.message.edit({
                                    embed: {
                                        color: parseInt('36393E', 16),
                                        title: 'Monopoly',
                                        description: `**__<@${reactor.id}>__** just ${currentPrice === p.price ? 'started the bidding off!' : 'raised the bid price another $100!'}`,
                                        fields: [{
                                                name: 'Property up now',
                                                value: p.name,
                                                inline: true
                                            },
                                            {
                                                name: 'Current price',
                                                value: currentPrice,
                                                inline: true
                                            },
                                            {
                                                name: 'Current Highest Bidder',
                                                value: highestBidder ? `<@${highestBidder}>` : 'None',
                                                inline: true
                                            }
                                        ]
                                    }
                                }).then(() => {
                                    timeout1 = setTimeout(() => {
                                        this.message.edit({
                                            embed: {
                                                color: parseInt('36393E', 16),
                                                title: 'Monopoly',
                                                description: 'Going once..',
                                                fields: [{
                                                        name: 'Property up now',
                                                        value: p.name,
                                                        inline: true
                                                    },
                                                    {
                                                        name: 'Current price',
                                                        value: currentPrice,
                                                        inline: true
                                                    },
                                                    {
                                                        name: 'Current Highest Bidder',
                                                        value: highestBidder ? `<@${highestBidder}>` : 'None',
                                                        inline: true
                                                    }
                                                ]
                                            }
                                        }).then(() => {
                                            timeout2 = setTimeout(() => {
                                                this.message.edit({
                                                    embed: {
                                                        color: parseInt('36393E', 16),
                                                        title: 'Monopoly',
                                                        description: 'Going twice..',
                                                        fields: [{
                                                                name: 'Property up now',
                                                                value: p.name,
                                                                inline: true
                                                            },
                                                            {
                                                                name: 'Current price',
                                                                value: currentPrice,
                                                                inline: true
                                                            },
                                                            {
                                                                name: 'Current Highest Bidder',
                                                                value: highestBidder ? `<@${highestBidder}>` : 'None',
                                                                inline: true
                                                            }
                                                        ]
                                                    }
                                                }).then(() => {
                                                    timeout3 = setTimeout(() => {
                                                        this.message.edit({
                                                            embed: {
                                                                color: parseInt('36393E', 16),
                                                                title: 'Monopoly',
                                                                description: `Sold! To <@${highestBidder}>!`,
                                                                fields: [{
                                                                        name: 'Property up now',
                                                                        value: p.name,
                                                                        inline: true
                                                                    },
                                                                    {
                                                                        name: 'Current price',
                                                                        value: currentPrice,
                                                                        inline: true
                                                                    },
                                                                    {
                                                                        name: 'Current Highest Bidder',
                                                                        value: highestBidder ? `<@${highestBidder}>` : 'None',
                                                                        inline: true
                                                                    }
                                                                ]
                                                            }
                                                        });
                                                        this.map[this.map.indexOf(p)].ownedBy = highestBidder;
                                                        this.client.off('messageReactionAdd', this.reactionAddAuction);
                                                        if (auctionType === 'user') {
                                                            this.players[this.currentPlayer].money += currentPrice;
                                                            this.players.filter(e => e.id === reactor.id)[0].money -= currentPrice;
                                                        } else {
                                                            this.players.filter(e => e.id === reactor.id)[0].money -= currentPrice;
                                                        }
                                                        if (i === (properties.length - 1)) {
                                                            if (auctionType === 'user') {
                                                                if (die1 === die2) {
                                                                    this.returnToReadyState(`{{currentuser}} started an auction and sold some properties!\nThey also rolled a double, so they go again!`);
                                                                } else {
                                                                    this.advancePlayer();
                                                                    this.returnToReadyState(`{{previoususer}} started an auction and sold some properties!\nIt is now {{currentuser}}\'s turn!`);
                                                                }
                                                            }
                                                            this.message.removeReaction('🆙');
                                                        } else {
                                                            this.bankruptPlayers.push(this.players[this.currentPlayer])
                                                            this.advancePlayer();
                                                            delete this.players[this.previousPlayer];
                                                            if (this.players.length === 1) {
                                                                this.returnToReadyState('{{currentplayer}} has won!');
                                                                this.end();
                                                            }
                                                        }
                                                    }, 2000);
                                                });
                                            }, 2000);
                                        });
                                    }, 2000);
                                });
                        }
                    }
                }
                this.client.on('messageReactionAdd', this.reactionAddAuction);
            }
        }
    }

    handleCards(card, deck, die1, die2) {
        switch (card.special) {
            case 'perplayer':
                this.players.forEach(p => {
                    if (p.id === this.players[this.currentPlayer].id) return;
                    else {
                        p.money += card.money;
                        this.players[this.currentPlayer].money -= card.money;
                    }
                });
                if (die1 === die2) {
                    this.returnToReadyState(`{{currentuser}} pulled from the ${deck} and recieved a "${card.name}" card!\nThey also rolled a double, so they go again!`);
                } else {
                    this.advancePlayer();
                    this.returnToReadyState(`{{previoususer}} pulled from the ${deck} and recieved a "${card.name}" card!\nIt is now {{currentuser}}\'s turn!`);
                }
                break;
            case 'nojail':
                this.players[this.currentPlayer].noJailCards++;
                if (die1 === die2) {
                    this.returnToReadyState(`{{currentuser}} pulled from the ${deck} and recieved a "${card.name}" card!\nThey also rolled a double, so they go again!`);
                } else {
                    this.advancePlayer();
                    this.returnToReadyState(`{{previoususer}} pulled from the ${deck} and recieved a "${card.name}" card!\nIt is now {{currentuser}}\'s turn!`);
                }
                break;
            case 'tojail':
                this.players[this.currentPlayer].currentLocation = 'jail';
                this.advancePlayer();
                this.returnToReadyState(`{{previoususer}} pulled from the ${deck} and recieved a "${card.name}" card! They are now in jail!\nIt is now {{currentuser}}\'s turn!`);
                break;
            case 'togo':
                this.players[this.currentPlayer].currentLocation = 0;
                this.players[this.currentPlayer].money += 200;
                if (die1 === die2) {
                    this.returnToReadyState(`{{currentuser}} pulled from the ${deck} and recieved a "${card.name}" card!\nThey also rolled a double, so they go again!`);
                } else {
                    this.advancePlayer();
                    this.returnToReadyState(`{{previoususer}} pulled from the ${deck} and recieved a "${card.name}" card!\nIt is now {{currentuser}}\'s turn!`);
                }
                break;
            case '40house115hotel':
                let houses = this.map.filter(p => p.ownedBy === this.players[this.currentPlayer].id && p.houses && p.houses < 5).map(p => p.houses).reduce((a, b) => a + b, 0);
                let hotels = this.map.filter(p => p.ownedBy === this.players[this.currentPlayer].id && p.houses && p.houses === 5).map(p => p.houses).reduce((a, b) => a + b, 0);
                this.players[this.currentPlayer].money -= ((houses * 40) + (hotels * 115));
                if (die1 === die2) {
                    this.returnToReadyState(`{{currentuser}} pulled from the ${deck} and recieved a "${card.name}" card!\nThey also rolled a double, so they go again!`);
                } else {
                    this.advancePlayer();
                    this.returnToReadyState(`{{previoususer}} pulled from the ${deck} and recieved a "${card.name}" card!\nIt is now {{currentuser}}\'s turn!`);
                }
                break;
            case '25house100hotel':
                this.players[this.currentPlayer].money -= ((this.map.filter(p => p.ownedBy === this.players[this.currentPlayer].id && p.houses && p.houses < 5).map(p => p.houses).reduce((a, b) => a + b, 0) * 25) + (this.map.filter(p => p.ownedBy === this.players[this.currentPlayer].id && p.houses && p.houses === 5).map(p => p.houses).reduce((a, b) => a + b, 0) * 100));
                if (die1 === die2) {
                    this.returnToReadyState(`{{currentuser}} pulled from the ${deck} and recieved a "${card.name}" card!\nThey also rolled a double, so they go again!`);
                } else {
                    this.advancePlayer();
                    this.returnToReadyState(`{{previoususer}} pulled from the ${deck} and recieved a "${card.name}" card!\nIt is now {{currentuser}}\'s turn!`);
                }
                break;
            case 'back3':
                this.players[this.currentPlayer].currentLocation -= 3;
                if (die1 === die2) {
                    this.returnToReadyState(`{{currentuser}} pulled from the ${deck} and recieved a "${card.name}" card!\nThey also rolled a double, so they go again!`);
                } else {
                    this.advancePlayer();
                    this.returnToReadyState(`{{previoususer}} pulled from the ${deck} and recieved a "${card.name}" card!\nIt is now {{currentuser}}\'s turn!`);
                }
                break;
            case 'toillinois':
                if (this.map.indexOf(this.map.filter(p => p.name === 'Illinois Avenue')[0]) < this.players[this.currentPlayer].currentLocation) {
                    this.players[this.currentPlayer].currentLocation = this.map.indexOf(this.map.filter(p => p.name === 'Illinois Avenue')[0]);
                    this.players[this.currentPlayer].money += 200;
                }else {
                    this.players[this.currentPlayer].currentLocation = this.map.indexOf(this.map.filter(p => p.name === 'Illinois Avenue')[0]);
                }
                if (die1 === die2) {
                    this.returnToReadyState(`{{currentuser}} pulled from the ${deck} and recieved a "${card.name}" card!\nThey also rolled a double, so they go again!`);
                } else {
                    this.advancePlayer();
                    this.returnToReadyState(`{{previoususer}} pulled from the ${deck} and recieved a "${card.name}" card!\nIt is now {{currentuser}}\'s turn!`);
                }
                break;
            case 'toboardwalk':
                this.players[this.currentPlayer].currentLocation = this.map.indexOf(this.map.filter(p => p.name === 'Boardwalk')[0]);
                if (die1 === die2) {
                    this.returnToReadyState(`{{currentuser}} pulled from the ${deck} and recieved a "${card.name}" card!\nThey also rolled a double, so they go again!`);
                } else {
                    this.advancePlayer();
                    this.returnToReadyState(`{{previoususer}} pulled from the ${deck} and recieved a "${card.name}" card!\nIt is now {{currentuser}}\'s turn!`);
                }
                break;
            case 'tonearestrailroadtwiceowed':
                this.players[this.currentPlayer].currentLocation = this.map.indexOf(this.map.filter((p, i) => p.type === 'railroad' && i >= this.players[this.currentPlayer].currentLocation)[0])
                if (this.map[this.players[this.currentPlayer].currentLocation].ownedBy) {
                    if (this.players[this.currentPlayer].money < 2 * this.map[this.players[this.currentPlayer].this.currentLocation].rent[this.map.filter(p => p.type === 'railroad' && p.ownedBy === property.ownedBy).length.toString()]) {
                        this.handleDebt(this.map[this.players[this.currentPlayer].currentLocation].ownedBy, 2 * this.map[this.players[this.currentPlayer].this.currentLocation].rent[this.map.filter(p => p.type === 'railroad' && p.ownedBy === property.ownedBy).length.toString()]);
                    } else {
                        this.players.filter(p => p.id === this.map[this.players[this.currentPlayer].this.currentLocation].ownedBy)[0].money += 2 * property.rent[this.map.filter(p => p.type === 'railroad' && p.ownedBy === property.ownedBy).length.toString()];
                        this.players[this.currentPlayer].money -= 2 * this.map[this.players[this.currentPlayer].this.currentLocation].rent[this.map.filter(p => p.type === 'railroad' && p.ownedBy === property.ownedBy).length.toString()];
                        if (die1 === die2) {
                            this.returnToReadyState(`{{currentuser}} pulled from the ${deck} and recieved a "${card.name}" card!\nThey also rolled a double, so they go again!`);
                        } else {
                            this.advancePlayer();
                            this.returnToReadyState(`{{previoususer}} pulled from the ${deck} and recieved a "${card.name}" card!\nIt is now {{currentuser}}\'s turn!`);
                        }
                    }
                } else {
                    this.handleMapLocation(this.map[this.players[this.currentPlayer].currentLocation], die1, die2);
                }
                break;
            case 'nearestutilityx10':
                if (this.map[this.players[this.currentPlayer].currentLocation].ownedBy) {
                    this.players[this.currentPlayer].currentLocation = this.map.indexOf(this.map.filter((p, i) => p.type === 'utility' && i >= this.players[this.currentPlayer].currentLocation)[0])
                    if (this.players[this.currentPlayer].money < die1 * 10) {
                        this.handleDebt(this.map[this.players[this.currentPlayer].currentLocation].ownedBy, die1 * 10);
                    } else {
                        this.players.filter(p => p.id === this.map[this.players[this.currentPlayer].currentLocation].ownedBy)[0].money += die * 10;
                        this.players[this.currentPlayer].money -= die1 * 10;
                        if (die1 === die2) {
                            this.returnToReadyState(`{{currentuser}} pulled from the ${deck} and recieved a "${card.name}" card!\nThey also rolled a double, so they go again!`);
                        } else {
                            this.advancePlayer();
                            this.returnToReadyState(`{{previoususer}} pulled from the ${deck} and recieved a "${card.name}" card!\nIt is now {{currentuser}}\'s turn!`);
                        }
                    }
                } else {
                    this.handleMapLocation(this.map[this.players[this.currentPlayer].currentLocation], die1, die2);
                }
                break;
            case 'toreading':
                if (this.map.indexOf(this.map.filter(p => p.name === 'Reading Railroad')[0]) < this.players[this.currentPlayer].currentLocation) {
                    this.players[this.currentPlayer].currentLocation = this.map.indexOf(this.map.filter(p => p.name === 'Reading Railroad')[0]);
                    this.players[this.currentPlayer].money += 200;
                }else {
                    this.players[this.currentPlayer].currentLocation = this.map.indexOf(this.map.filter(p => p.name === 'Reading Railroad')[0]);
                }
                if (die1 === die2) {
                    this.returnToReadyState(`{{currentuser}} pulled from the ${deck} and recieved a "${card.name}" card!\nThey also rolled a double, so they go again!`);
                } else {
                    this.advancePlayer();
                    this.returnToReadyState(`{{previoususer}} pulled from the ${deck} and recieved a "${card.name}" card!\nIt is now {{currentuser}}\'s turn!`);
                }
                break;
            case 'tocharles':
                if (this.map.indexOf(this.map.filter(p => p.name === 'St. Charles Place')[0]) < this.players[this.currentPlayer].currentLocation) {
                    this.players[this.currentPlayer].currentLocation = this.map.indexOf(this.map.filter(p => p.name === 'St. Charles Place')[0]);
                    this.players[this.currentPlayer].money += 200;
                }else {
                    this.players[this.currentPlayer].currentLocation = this.map.indexOf(this.map.filter(p => p.name === 'St. Charles Place')[0]);
                }
                if (die1 === die2) {
                    this.returnToReadyState(`{{currentuser}} pulled from the ${deck} and recieved a "${card.name}" card!\nThey also rolled a double, so they go again!`);
                } else {
                    this.advancePlayer();
                    this.returnToReadyState(`{{previoususer}} pulled from the ${deck} and recieved a "${card.name}" card!\nIt is now {{currentuser}}\'s turn!`);
                }
                break;
            case null:
                this.players[this.currentPlayer].money += card.money;
                if (die1 === die2) {
                    this.returnToReadyState(`{{currentuser}} pulled from the ${deck} and recieved a "${card.name}" card!\nThey also rolled a double, so they go again!`);
                } else {
                    this.advancePlayer();
                    this.returnToReadyState(`{{previoususer}} pulled from the ${deck} and recieved a "${card.name}" card!\nIt is now {{currentuser}}\'s turn!`);
                }
                break;
        }
        return;
    }

    handleRent(property, die1, die2) {
        switch (property.type) {
            case 'normal':
                if (!property.mortgaged) {
                    if (this.players[this.currentPlayer].money < property.rent[property.houses.toString()]) {
                        this.handleDebt(property.ownedBy, property.rent[property.houses.toString()]);
                    } else {
                        this.players.filter(p => p.id === property.ownedBy)[0].money += property.rent[property.houses.toString()];
                        this.players[this.currentPlayer].money -= property.rent[property.houses.toString()];
                        if (die1 === die2 && die1 && die2) {
                            this.returnToReadyState(`{{currentuser}} went to ${property.name} had to pay $${property.rent[property.houses.toString()]} to <@${property.ownedBy}> in rent!\nThey also rolled a double, so they go again!`);
                        } else if (die1 && die2) {
                            this.advancePlayer();
                            this.returnToReadyState(`{{previoususer}} went to ${property.name} had to pay $${property.rent[property.houses.toString()]} to <@${property.ownedBy}> in rent!\nIt is now {{currentuser}}\'s turn!`);
                        }
                    }
                }else {
                    if (die1 === die2 && die1 && die2) {
                        this.returnToReadyState(`{{currentuser}} went to ${property.name} but did not have to pay <@${property.ownedBy}> in rent because the property was mortgaged!\nThey also rolled a double, so they go again!`);
                    } else if (die1 && die2) {
                        this.advancePlayer();
                        this.returnToReadyState(`{{previoususer}} went to ${property.name} but did not have to pay <@${property.ownedBy}> in rent because the property was mortgaged!\nIt is now {{currentuser}}\'s turn!`);
                    }
                }
                break;
            case 'railroad':
                if (!property.mortgaged) {
                    if (this.players[this.currentPlayer].money < property.rent[this.map.filter(p => p.type === 'railroad' && p.ownedBy === property.ownedBy).length.toString()]) {
                        this.handleDebt(property.ownedBy, property.rent[this.map.filter(p => p.type === 'railroad' && p.ownedBy === property.ownedBy).length.toString()]);
                    } else {
                        this.players.filter(p => p.id === property.ownedBy)[0].money += property.rent[this.map.filter(p => p.type === 'railroad' && p.ownedBy === property.ownedBy).length.toString()];
                        this.players[this.currentPlayer].money -= property.rent[this.map.filter(p => p.type === 'railroad' && p.ownedBy === property.ownedBy).length.toString()];
                        if (die1 === die2 && die1 && die2) {
                            this.returnToReadyState(`{{currentuser}} went to ${property.name} had to pay $${property.rent[this.map.filter(p => p.type === 'railroad' && p.ownedBy === property.ownedBy).length.toString()]} to <@${property.ownedBy}> in rent!\nThey also rolled a double, so they go again!`);
                        } else if (die1 && die2) {
                            this.advancePlayer();
                            this.returnToReadyState(`{{previoususer}} went to ${property.name} had to pay $${property.rent[this.map.filter(p => p.type === 'railroad' && p.ownedBy === property.ownedBy).length.toString()]} to <@${property.ownedBy}> in rent!\nIt is now {{currentuser}}\'s turn!`);
                        }
                    }
                }else {
                    if (die1 === die2 && die1 && die2) {
                        this.returnToReadyState(`{{currentuser}} went to ${property.name} but did not have to pay <@${property.ownedBy}> in rent because the property was mortgaged!\nThey also rolled a double, so they go again!`);
                    } else if (die1 && die2) {
                        this.advancePlayer();
                        this.returnToReadyState(`{{previoususer}} went to ${property.name} but did not have to pay <@${property.ownedBy}> in rent because the property was mortgaged!\nIt is now {{currentuser}}\'s turn!`);
                    }
                }
                break;
            case 'utility':
                if (!property.mortgaged) {
                    this.otherAction = true;
                    this.message.edit({
                        content: `<@${this.players[this.currentPlayer].id}>`,
                        embed: {
                            title: 'Monopoly',
                            color: parseInt('36393E', 16),
                            description: `You landed on ${property.name}, which owned by <@${property.ownedBy}> and not mortgaged, to continue, roll the die.`,
                            fields: [{
                                    name: 'Your money',
                                    value: `Up now: <@${this.players[this.currentPlayer].id}>\nUp next: <@${this.players[this.nextPlayer].id}>`
                                },
                                {
                                    name: 'Die 1',
                                    value: die1
                                },
                                {
                                    name: 'Die 2',
                                    value: die2
                                }
                            ]
                        }
                    })
                    this.reactionAddUtility = (mes, emoji, user) => {
                        let reactor = mes.channel.guild.members.get(user).user;
                        if (this.message.id === mes.id && !reactor.bot && emoji.name === '🎲') {
                            let die = random(1, 6);
                            if (this.players[this.currentPlayer].money < die * property.rent[this.map.filter(p => p.type === 'utility' && p.ownedBy === property.ownedBy).length.toString()]) {
                                this.handleDebt(property.ownedBy, die * property.rent[this.map.filter(p => p.type === 'utility' && p.ownedBy === property.ownedBy).length.toString()]);
                            } else {
                                this.players.filter(p => p.id === property.ownedBy)[0].money += die * property.rent[this.map.filter(p => p.type === 'utility' && p.ownedBy === property.ownedBy).length.toString()];
                                this.players[this.currentPlayer].money -= die * property.rent[this.map.filter(p => p.type === 'utility' && p.ownedBy === property.ownedBy).length.toString()];
                                if (die1 === die2 && die1 && die2) {
                                    this.returnToReadyState(`{{currentuser}} went to ${property.name} had to pay $${property.rent[this.map.filter(p => p.type === 'railroad' && p.ownedBy === property.ownedBy).length.toString()]} to <@${property.ownedBy}> in rent!\nThey also rolled a double, so they go again!`);
                                } else if (die1 && die2) {
                                    this.advancePlayer();
                                    this.returnToReadyState(`{{previoususer}} went to ${property.name} had to pay $${property.rent[this.map.filter(p => p.type === 'railroad' && p.ownedBy === property.ownedBy).length.toString()]} to <@${property.ownedBy}> in rent!\nIt is now {{currentuser}}\'s turn!`);
                                }
                            }
                        }
                    }
                    this.client.on('messageReactionAdd', this.reactionAddUtility);
                }else {
                    if (die1 === die2 && die1 && die2) {
                        this.returnToReadyState(`{{currentuser}} went to ${property.name} but did not have to pay <@${property.ownedBy}> in rent because the property was mortgaged!\nThey also rolled a double, so they go again!`);
                    } else if (die1 && die2) {
                        this.advancePlayer();
                        this.returnToReadyState(`{{previoususer}} went to ${property.name} but did not have to pay <@${property.ownedBy}> in rent because the property was mortgaged!\nIt is now {{currentuser}}\'s turn!`);
                    }
                }
            break;
        }
        return;
    }

    advancePlayer() {
        this.previousPlayer = this.currentPlayer;
        this.currentPlayer = this.nextPlayer;
        if (this.players[this.nextPlayer + 1]) this.nextPlayer++;
        else this.nextPlayer = 0;
        return;
    }

    removePlayer(player) {
        this.players = this.players.filter(p => p.id !== player.id);

        if (!this.active) {
            player.getDMChannel().then(chnl => {
                chnl.createMessage({
                    embed: {
                        color: parseInt('ffff00', 16),
                        title: 'You left the game!',
                        description: 'You can still rejoin before the game starts.'
                    }
                });
            });
        } else {
            player.getDMChannel().then(chnl => {
                chnl.createMessage({
                    embed: {
                        color: parseInt('ff0000', 16),
                        title: 'You left the game!',
                        description: 'All of your money is forfeit and you can\'t rejoin.'
                    }
                });
            });
        }
        if (this.players.length < 2) {
            this.end();
            this.message.edit({
                embed: {
                    title: 'Game Ended',
                    color: parseInt('ffff00', 16),
                    description: 'The game ended because there wasn\'t enough players to play!'
                }
            }).then(() => {
                setTimeout(() => {
                    this.message.delete()
                }, 5000);
            });
        } else if (!this.players[this.currentPlayer]) {
            this.advancePlayer();
            this.returnToReadyState('A player left!\nIt is now {{currentuser}}\'s turn!');
        }
        return;
    }
}

module.exports = {
    Game,

    games: []
}