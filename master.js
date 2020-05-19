require('dotenv').config();
const Discord = require('discord.js');
const client = new Discord.Client();
const config = require("./config.json");
const presence = require("./activities.json");
var fs = require('fs');
const prefix = process.env.PREFIX;
const save = require("./saves.json");
const saveusers = require("./saves-user.json");

//=====================
//------  STATS  ------
//=====================

//FARM
var baseHarvest = 15;

//DISTILLERY
var vodkaMultiplier = 1;
var baseBottles = 3;

//TREES
var chopfoodreq = 10;
var chopvodkareq = 2;
var chopbaselogs = 5;
var woodMultiplier = 1;

//MINING
var minefoodreq = 15;
var minevodkareq = 3;
var minebasemetals = 5;
var minebaseuranium = 0;
var metalMultiplier = 1;
var uraniumMultiplier = 3;

//REFINING
var steelreffoodreq = 20;
var steelrefvodkareq = 6;
var uranreffoodreq = 23;
var uranrefvodkareq = 7;
var basesteel = 4;
var steelMultiplier = 1;

//=====================
//----  BUILDING  -----
//=====================

//FARM
var buildfarmfood = 200;
var buildfarmvodka = 25;
var buildfarmwood = 50;
var buildfarmmetal = 5;

//DISTILLERY
var builddistillfood = 350;
var builddistillvodka = 40;
var builddistillwood = 80;
var builddistillmetal = 20;

//TREEFARM
var buildtreefarmfood = 500;
var buildtreefarmvodka = 60;
var buildtreefarmwood = 100;
var buildtreefarmmetal = 10;

//MINE
var buildminefood = 700;
var buildminevodka = 70;
var buildminewood = 80;
var buildminemetal = 20;
var buildminesteel = 15;

//REFINERY
var buildrefinefood = 1000;
var buildrefinevodka = 120;
var buildrefinewood = 80;
var buildrefinemetal = 40;
var buildrefinesteel = 40;

//FACTORY
var buildfactoryfood = 2000;
var buildfactoryvodka = 300;
var buildfactorywood = 100;
var buildfactorymetal = 100;
var buildfactorysteel = 100;

//=====================

//COOLDOWNS
const farmcooldown = new Set();
const distillcooldown = new Set();
const chopcooldown = new Set();
const minecooldown = new Set();
const refinecooldown = new Set();
const buildbuildingcooldown = new Set();
const buildmachinecooldown = new Set();
const manufacturecooldown = new Set();

//=====================

var GLOBALMULTIPLIER = 1.00;
const boostAmount = 1000;

const helpembed = new Discord.MessageEmbed()
    .setColor('FF0000')
    .setTitle('Commands')
    .addFields(
        {name:'General Commands',
        value:
        `.help       -   Shows this screen
         .startserver -   Start your communist empire!
         .start      -   Start your user
         .profile    -   Shows your ranking and profile and stuff
         .resources   -   Shows resource count for this empire
         .helpdetailed  -  Detailed help screen`
        },
        {name:'Farming Commands',
        value:
        `.farm       -   Farm food for the comrades
         .distill    -   Make vodka for the comrades`
        },
        {name:'Resource Commands',
        value:
        `.chop       -   Chop wood for build materials
         .mine       -   Mine unrefined metals and building materials`
        },
        {name:'Refining Materials with .refine',
        value:
        `metal       -   Refines metal to steel
         uranium     -   Turns uranium into weapons grade uranium`
        },
        {name:'Building with .build',
        value:
        `Farm        -   Farm with less cooldown
         Distillery  -   Distill with less cooldown
         Tree farm   -   Chop with less cooldown
         Mine        -   Mine materials with less cooldown
         Refinery    -   Refine metals with less cooldown
         Factory     -   Allows to produce munitions
         Base        -   Battle the dirty capitalists more often
         Airbase     -   Bomb the dirty capitalists more often
         Silo        -   Nuke the dirty capitalists more often`
        },
        {name:'Manufacturing with .manufacture',
        value:
        `Guns        -   Make guns to battle the dirty capitalists
         Bomb        -   Make bombs to bomb the dirty capitalists
         Nuke        -   Make nukes to nuke the dirty capitalists`
        },
        {name:'More building with .build',
        value:
        `Tank        -   Build tanks for battles
         Plane       -   Build planes for bombing
         Ship        -   Build ships to transport tanks and planes`
        },
        {name:'Battle capitalism',
        value:
        `.battle     -   Battle the capitalists
         .war        -   Go to war with the capitalists
         .bomb       -   Bomb the capitalists
         .nuke       -   Nuke the dirty capitalists`
        },
        {name:'Global Multiplier',
        value:`.boost      -   Use **${boostAmount} Comrade points** to boost the global multiplier (all servers) by 10% for an hour!`
        }
    );

//=====================

const haveNotStartedEmbed = new Discord.MessageEmbed()
    .setColor('#FF0000')
    .setTitle(`You have not started your server yet!`)
    .setDescription(`Run the command .startserver to create a new savestate for this server!`);

//=====================

const haveNotStartedUserEmbed = new Discord.MessageEmbed()
    .setColor('#FF0000')
    .setTitle(`You have not started your own profile yet!`)
    .setDescription(`Run the command .start to create a new save for this user!`);

//=====================

const haveNotStarterUserWARNEmbed = new Discord.MessageEmbed()
    .setColor('#FF0000')
    .setTitle(`You haven't started your own profile!`)
    .setDescription(`Thanks for contributing to this nation, but in order to acquire **Comrade points** and **Glory** you must run .start!`);

//=====================

const notEnoughComradeEmbed = new Discord.MessageEmbed()
    .setColor('#FF0000')
    .setTitle("You don't have enough comrade points!")
    .setDescription(`You need **${boostAmount} comrade points** to boost the global multiplier!`);

//=====================

const boostSuccessfulEmbed = new Discord.MessageEmbed()
    .setColor('#FF0000')
    .setTitle(`You just used **${boostAmount} comrade points** to boost the global multiplier by **10%** for an hour!`)
    .setDescription("Good work, comrade.");

//=====================

const buildcooldownembed = new Discord.MessageEmbed()
    .setColor('#FF0000')
    .setTitle('We\'re still constructing the last building!')
    .setDescription('The cooldown for building something is 1 minute and 30 seconds!');
//=================================================================================================

var serverSave = {
    servers:[]
};
var userSave = {
    users:[]
};

//=================================================================================================

client.on('ready', () => {
    var randAct = Math.floor(Math.random()*4);
    if(presence.activities[randAct].type!="STREAMING")
        client.user.setActivity(presence.activities[randAct].desc, {type:presence.activities[randAct].type})
    else
        client.user.setActivity(presence.activities[randAct].desc, {type:presence.activities[randAct].type,url:presence.activities[randAct].url})
    //RELOAD SERVER
    var parsedjson = save;
    var parsedjsonuser = saveusers;
    for(var i = 0;i<parsedjson.length;i++)
    {
        serverSave.servers.push({
            id:parsedjson[i].id,
            value:parsedjson[i].value,
            food:parsedjson[i].food,
            vodka:parsedjson[i].vodka,
            wood:parsedjson[i].wood,
            metal:parsedjson[i].metal,
            steel:parsedjson[i].steel,
            uranium:parsedjson[i].uranium,
            nuclear:parsedjson[i].nuclear,
            guns:parsedjson[i].guns,
            bombs:parsedjson[i].bombs,
            nukes:parsedjson[i].nukes,
            tanks:parsedjson[i].tanks,
            planes:parsedjson[i].planes,
            ships:parsedjson[i].ships,
            farms:parsedjson[i].farms,
            distilleries:parsedjson[i].distilleries,
            treefarms:parsedjson[i].treefarms,
            mines:parsedjson[i].mines,
            refineries:parsedjson[i].refineries,
            factories:parsedjson[i].factories,
            bases:parsedjson[i].bases,
            airbases:parsedjson[i].airbases,
            silos:parsedjson[i].silos
        });
    }
    for(var i = 0;i<parsedjsonuser.length;i++)
    {
        userSave.users.push({
            id:parsedjsonuser[i].id,
            comrade:parsedjsonuser[i].comrade,
            glory:parsedjsonuser[i].glory
        });
    }
    //console.log(serverSave.servers);
    console.log(`Logged in as ${client.user.tag}`);
});

//=====================

client.on('message', m => {
    var invalid = !(m.content.startsWith(prefix))||m.author.bot;
    if(!invalid)
    {
        switch(m.content)
        {
//================================================================================================
//-------------------------------------  STARTING COMMANDS  --------------------------------------
//================================================================================================
            case '.help':
                //m.channel.send(m.guild.name);
                
                m.channel.send(helpembed);
                break;
//================================================================================================
            case '.startserver':
                var existing = false;
                if(serverSave.servers[0]==undefined)
                {
                    serverSave.servers.push({
                        id:m.guild.id,
                        value:m.guild.name,
                        food:0,
                        vodka:0,
                        wood:0,
                        metal:0,
                        steel:0,
                        uranium:0,
                        nuclear:0,
                        guns:0,
                        bombs:0,
                        nukes:0,
                        tanks:0,
                        planes:0,
                        ships:0,
                        farms:0,
                        distilleries:0,
                        treefarms:0,
                        mines:0,
                        refineries:0,
                        factories:0,
                        bases:0,
                        airbases:0,
                        silos:0
                    });
                    m.channel.send(`Created a new savestate for this server!`);
                }
                else
                {
                    existing = false;
                    for(var i = 0;i<serverSave.servers.length;i++)
                    {
                        if(!(serverSave.servers[i]==undefined||!(serverSave.servers[i]['id']==m.guild.id)))
                        {
                            console.log(`Hey slow the fuck down, this exists already!`)
                            existing = true;
                            break;
                        }
                    }
                    if(existing)
                    {
                        m.channel.send(`Existing savestate found for this server!`);
                    }
                    else
                    {
                        serverSave.servers.push({
                            id:m.guild.id,
                            value:m.guild.name,
                            food:0,
                            vodka:0,
                            wood:0,
                            metal:0,
                            steel:0,
                            uranium:0,
                            nuclear:0,
                            guns:0,
                            bombs:0,
                            nukes:0,
                            tanks:0,
                            planes:0,
                            ships:0,
                            farms:0,
                            distilleries:0,
                            treefarms:0,
                            mines:0,
                            refineries:0,
                            factories:0,
                            bases:0,
                            airbases:0,
                            silos:0
                        });
                        m.channel.send(`Created a new savestate for this server!`);
                        //console.log(serverSave.servers);
                    }
                }
                break;
//================================================================================================
            case '.start':
                var existinguser = false;
                if(userSave.users[0]==undefined)
                {
                    userSave.users.push({
                        id:m.author.id,
                        comrade:0,
                        glory:0
                    });
                    m.channel.send(`Created a new save for this user!`);
                }
                else
                {
                    existinguser = false;
                    for(var i = 0;i<userSave.users.length;i++)
                    {
                        if(!(userSave.users[i]==undefined||!(userSave.users[i]['id']==m.author.id)))
                        {
                            console.log('Hey slow the fuck down, you exist already!');
                            existinguser = true;
                            break;
                        }
                    }
                    if(existinguser)
                    {
                        m.channel.send(`Existing save found for this user!`);
                    }
                    else
                    {
                        userSave.users.push({
                            id:m.author.id,
                            comrade:0,
                            glory:0
                        });
                        m.channel.send(`Created a new save for this user!`);
                    }
                }
                //console.log(userSave.users);
                break;
//================================================================================================
//------------------------------------ RESOURCE COMMANDS  ----------------------------------------
//================================================================================================
            case '.farm':
                var serverId=-1;
                for(var i = 0;i<serverSave.servers.length;i++)
                {
                    if(serverSave.servers[i]['id']==m.guild.id)
                    {
                        serverId=i;
                        break;
                    }
                }
                var userId=-1;
                for(var i = 0;i<userSave.users.length;i++)
                {
                    if(userSave.users[i]['id']==m.author.id)
                    {
                        userId=i;
                        break;
                    }
                }
                if(farmcooldown.has(m.author.id))
                {
                    var farmcooldownembed = new Discord.MessageEmbed()
                        .setColor('#FF0000')
                        .setTitle(`The crops are still growing. Give them some time!`)
                        .setDescription(`The cooldown for this is ${Math.round(((30000000/(100*(serverSave.servers[serverId]['farms'])+1200))+5000)/1000)} seconds. Build more farms to shorten this cooldown!`);
                    m.channel.send(farmcooldownembed);
                }
                else
                {
                    if(serverId!=-1)
                    {
                        var gloriousChance = (30/(1+Math.pow(Math.E,((0.1*serverSave.servers[serverId]['farms'])-5))))+10;
                        var currHarvest = Math.round((30/(1+Math.pow(Math.E,((-0.25*serverSave.servers[serverId]['farms'])+10))))+15)
                        var currHarvestMult = (25/(1+Math.pow(Math.E,((-0.15*serverSave.servers[serverId]['farms'])+5))))+1
                        var gloriousHarvest = (Math.ceil(Math.random()*gloriousChance))<=1;
                        var randFood = Math.round((Math.floor(Math.random()*currHarvestMult)+currHarvest)*(gloriousHarvest?3:1)*GLOBALMULTIPLIER);
                        serverSave.servers[serverId]['food']+=randFood;
                        var farmembed = new Discord.MessageEmbed()
                            .setColor('#FF0000')
                            .setTitle(`In this harvest you farmed ${randFood} food for the nation.`)
                            .setDescription(`When you build more farms, you can increase your food production!`);
                        var farmembedglorious = new Discord.MessageEmbed()
                            .setColor('#FF0000')
                            .setTitle(`In this GLORIOUS HARVEST you farmed ${randFood} food for the nation!`)
                            .setDescription(`Glorious harvests give you 3x as much crop. You increase the chance of them when you build more farms.`)
                        m.channel.send(gloriousHarvest?farmembedglorious:farmembed);
                        //console.log(serverSave.servers);

                        if(userId!=-1)
                            userSave.users[userId]['comrade']+=1;
                        else
                            m.channel.send(haveNotStarterUserWARNEmbed);

                        //COOLDOWN
                        farmcooldown.add(m.author.id);
                        setTimeout(() => {
                            farmcooldown.delete(m.author.id);
                        },(30000000/(100*(serverSave.servers[serverId]['farms'])+1200))+5000);
                    }
                    else
                    {
                        m.channel.send(haveNotStartedEmbed);
                    }
                }
                break;
//================================================================================================
            case '.distill':
                var serverId=-1;
                for(var i = 0;i<serverSave.servers.length;i++)
                {
                    if(serverSave.servers[i]['id']==m.guild.id)
                    {
                        serverId=i;
                        break;
                    }
                }
                var userId=-1;
                for(var i = 0;i<userSave.users.length;i++)
                {
                    if(userSave.users[i]['id']==m.author.id)
                    {
                        userId=i;
                        break;
                    }
                }
                if(distillcooldown.has(m.author.id))
                {
                    var distillcooldownembed = new Discord.MessageEmbed()
                    .setColor('#FF0000')
                    .setTitle(`The vodka is still fermenting. Give it some time!`)
                    .setDescription(`The default cooldown for this is ${Math.round(((30000000/(100*(serverSave.servers[serverId]['distilleries'])+1200))+5000)/1000)} seconds. Build more distilleries to shorten this cooldown!`);
                    if(distillcooldown.has(m.author.id))
                    {
                        m.channel.send(distillcooldownembed);
                    }
                }
                else
                {
                    if(serverId!=-1)
                    {
                        var currBottles = Math.round((18/(1+Math.pow(Math.E,((-0.2*serverSave.servers[serverId]['distilleries'])+7))))+3);
                        var currBottlesMult = (6/(1+Math.pow(Math.E,((-0.25*serverSave.servers[serverId]['distilleries'])+6))))+1;
                        var randBottles = Math.round((Math.floor(Math.random()*currBottlesMult)+currBottles)*GLOBALMULTIPLIER);
                        serverSave.servers[serverId]['vodka']+=randBottles;
                        var distillembed = new Discord.MessageEmbed()
                            .setColor('#FF0000')
                            .setTitle(`You've distilled ${randBottles} bottles of vodka for the nation.`)
                            .setDescription(`When you build more distilleries, you can increase your vodka production!`);
                        m.channel.send(distillembed);

                        if(userId!=-1)
                            userSave.users[userId]['comrade']+=1;
                        else
                            m.channel.send(haveNotStarterUserWARNEmbed);

                        //COOLDOWN
                        distillcooldown.add(m.author.id);
                        setTimeout(() => {
                            distillcooldown.delete(m.author.id);
                        },(30000000/(100*(serverSave.servers[serverId]['distilleries'])+1200))+5000);
                    }
                    else
                    {
                        m.channel.send(haveNotStartedEmbed);
                    }
                }
                break;
//================================================================================================
            case '.chop':
                var serverId=-1;
                for(var i = 0;i<serverSave.servers.length;i++)
                {
                    if(serverSave.servers[i]['id']==m.guild.id)
                    {
                        serverId=i;
                        break;
                    }
                }
                var userId=-1;
                for(var i = 0;i<userSave.users.length;i++)
                {
                    if(userSave.users[i]['id']==m.author.id)
                    {
                        userId=i;
                        break;
                    }
                }
                if(chopcooldown.has(m.author.id))
                {
                    var chopcooldownembed = new Discord.MessageEmbed()
                        .setColor('#FF0000')
                        .setTitle(`You've harassed the trees a bit much already. Why don't we take a break?`)
                        .setDescription(`The cooldown for this is ${Math.round(((48000000/(100*(serverSave.servers[serverId]['treefarms'])+1200))+8000)/1000)} seconds. Build more tree farms to shorten this cooldown!`);
                    if(chopcooldown.has(m.author.id))
                    {
                        m.channel.send(chopcooldownembed);
                    }
                }
                else
                {
                    if(serverId!=-1)
                    {
                        if(serverSave.servers[serverId]['food']>=chopfoodreq&&serverSave.servers[serverId]['vodka']>=chopvodkareq)
                        {
                            serverSave.servers[serverId]['food']-=chopfoodreq;
                            serverSave.servers[serverId]['vodka']-=chopvodkareq;
                            var currLogs = Math.round((15/(1+Math.pow(Math.E,((-0.2*serverSave.servers[serverId]['treefarms'])+7))))+5);
                            var currLogsMult = (4/(1+Math.pow(Math.E,((-0.25*serverSave.servers[serverId]['treefarms'])+6))))+1;
                            var randWood = Math.round((Math.floor(Math.random()*currLogsMult)+currLogs)*GLOBALMULTIPLIER);
                            serverSave.servers[serverId]['wood']+=randWood;
                            var chopembed = new Discord.MessageEmbed()
                                .setColor('#FF0000')
                                .setTitle(`You've cut ${randWood} logs for the nation.`)
                                .setDescription(`When you build more tree farms, you can increase your log production!`);
                            m.channel.send(chopembed);

                            if(userId!=-1)
                                userSave.users[userId]['comrade']+=2;
                            else
                                m.channel.send(haveNotStarterUserWARNEmbed);
                            
                            //COOLDOWN
                            chopcooldown.add(m.author.id);
                            setTimeout(() => {
                                chopcooldown.delete(m.author.id);
                            },(48000000/(100*(serverSave.servers[serverId]['treefarms'])+1200))+8000);
                        }
                        else
                        {
                            var chopnotenoughembed = new Discord.MessageEmbed()
                                .setColor('#FF0000')
                                .setTitle(`You don't have enough resources!`)
                                .setDescription(`
                                You can't work without food or vodka, so go farm and distill some!
                                For cutting wood, the amount is **${chopfoodreq}** food and **${chopvodkareq}** vodka.`);
                            m.channel.send(chopnotenoughembed);
                        }
                    }
                    else
                    {
                        m.channel.send(haveNotStartedEmbed);
                    }
                }
                break;
//================================================================================================
            case '.mine':
                var serverId=-1;
                for(var i = 0;i<serverSave.servers.length;i++)
                {
                    if(serverSave.servers[i]['id']==m.guild.id)
                    {
                        serverId=i;
                        break;
                    }
                }
                var userId=-1;
                for(var i = 0;i<userSave.users.length;i++)
                {
                    if(userSave.users[i]['id']==m.author.id)
                    {
                        userId=i;
                        break;
                    }
                }
                if(minecooldown.has(m.author.id))
                {
                    var minecooldownembed = new Discord.MessageEmbed()
                        .setColor('#FF0000')
                        .setTitle(`We're currently finding some new ore veins.`)
                        .setDescription(`The cooldown for this is ${Math.round(((48000000/(100*(serverSave.servers[serverId]['mines'])+1200))+8000)/1000)} seconds. Build more mines to shorten this cooldown!`);
                    if(minecooldown.has(m.author.id))
                    {
                        m.channel.send(minecooldownembed);
                    }
                }
                else
                {
                    if(serverId!=-1)
                    {
                        if(serverSave.servers[serverId]['food']>=minefoodreq&&serverSave.servers[serverId]['vodka']>=minevodkareq)
                        {
                            var currMetal = Math.round((13/(1+Math.pow(Math.E,((-0.25*serverSave.servers[serverId]['mines'])+7))))+5);
                            var currMetalMult = (4/(1+Math.pow(Math.E,((-0.25*serverSave.servers[serverId]['mines'])+6))))+1;
                            var currUranium =  Math.round(7/(1+Math.pow(Math.E,((-0.25*serverSave.servers[serverId]['mines'])+7.5))));
                            var currUraniumMult = (4/(1+Math.pow(Math.E,((-0.25*serverSave.servers[serverId]['mines'])+6))))+3;
                            serverSave.servers[serverId]['food']-=minefoodreq;
                            serverSave.servers[serverId]['vodka']-=minevodkareq;
                            var randMetal = Math.round((Math.floor(Math.random()*currMetalMult)+currMetal)*GLOBALMULTIPLIER);
                            var randUranium = Math.round((Math.floor(Math.random()*currUraniumMult)+currUranium)*GLOBALMULTIPLIER);
                            serverSave.servers[serverId]['metal']+=randMetal;
                            serverSave.servers[serverId]['uranium']+=randUranium;
                            var mineembed = new Discord.MessageEmbed()
                                .setColor('#FF0000')
                                .setTitle(`You've mined ${randMetal} metal${randUranium<1?' for the nation.':` and ${randUranium} uranium for the nation.`}`)
                                .setDescription(`When you build more mines, you can increase your metal and uranium production AND raise the chance of getting uranium!`);
                            m.channel.send(mineembed);

                            if(userId!=-1)
                                userSave.users[userId]['comrade']+=2;
                            else
                                m.channel.send(haveNotStarterUserWARNEmbed);

                            //COOLDOWN
                            minecooldown.add(m.author.id);
                            setTimeout(() => {
                                minecooldown.delete(m.author.id);
                            },(48000000/(100*(serverSave.servers[serverId]['mines'])+1200))+8000);
                        }
                        else
                        {
                            var minenotenoughembed = new Discord.MessageEmbed()
                                .setColor('#FF0000')
                                .setTitle(`You don't have enough resources!`)
                                .setDescription(`
                                You can't work without food or vodka, so go farm and distill some!
                                For mining metal, the amount is **${minefoodreq}** food and **${minevodkareq}** vodka.`);
                            m.channel.send(minenotenoughembed);
                        }
                    }
                    else
                    {
                        m.channel.send(haveNotStartedEmbed);
                    }

                
                }
                break;
//================================================================================================
            case '.refine':
                var refnothingembed = new Discord.MessageEmbed()
                    .setColor('#FF0000')
                    .setTitle(`You have to specify what you're refining.`)
                    .setDescription(`You can either refine **metal** or **uranium**.`);
                m.channel.send(refnothingembed);
                break;
//================================================================================================
            case '.refine metal':
                //COPY THIS
                var serverId=-1;
                for(var i = 0;i<serverSave.servers.length;i++)
                {
                    if(serverSave.servers[i]['id']==m.guild.id)
                    {
                        serverId=i;
                        break;
                    }
                }
                var userId=-1;
                for(var i = 0;i<userSave.users.length;i++)
                {
                    if(userSave.users[i]['id']==m.author.id)
                    {
                        userId=i;
                        break;
                    }
                }
                if(refinecooldown.has(m.author.id))
                {
                    var tempref = serverSave.servers[serverId]['refineries'];
                    var refcooldownstring = `${Math.floor(((61200000/((100*tempref)+1200))+10000)/(60*1000))>0?
                    `${Math.floor(((61200000/((100*tempref)+1200))+10000)/(60*1000))} ${Math.floor(((61200000/((100*tempref)+1200))+10000)/(60*1000))>1?'minutes':'minute'} ${(((61200000/((100*tempref+1200)))+10000)-(Math.floor(((61200000/((100*tempref)+1200))+10000)/(60*1000))*60*1000))/100} seconds`:`${Math.round(((61200000/((100*tempref)+1200))+10000)/1000)} seconds`}`;
                    var refineCooldown = new Discord.MessageEmbed()
                        .setColor("#FF0000")
                        .setTitle(`The refiners are currently cooling.`)
                        .setDescription(`The cooldown for this is ${refcooldownstring}.`);
                    m.channel.send(refineCooldown);
                }
                else
                {
                    if(serverId!=-1)
                    {
                        if(serverSave.servers[serverId]['food']>=steelreffoodreq&&serverSave.servers[serverId]['vodka']>=steelrefvodkareq&&serverSave.servers[serverId]['metal']!=0)
                        {
                            var currSteel = Math.round((16/(1+Math.pow(Math.E,((-0.18*serverSave.servers[serverId]['refineries'])+5))))+4);
                            serverSave.servers[serverId]['food']-=steelreffoodreq;
                            serverSave.servers[serverId]['vodka']-=steelrefvodkareq;
                            if(currSteel>serverSave.servers[serverId]['metal'])
                            {
                                serverSave.servers[serverId]['steel']+=serverSave.servers[serverId]['metal'];
                                currSteel = serverSave.servers[serverId]['metal'];
                                serverSave.servers[serverId]['metal'] = 0;
                            }
                            else
                            {
                                serverSave.servers[serverId]['metal']-=currSteel;
                                serverSave.servers[serverId]['steel']+=currSteel;
                            }

                            var refsteelembed = new Discord.MessageEmbed()
                                .setColor('#FF0000')
                                .setTitle(`You've refined ${currSteel} steel for the nation.`)
                                .setDescription(`When you build more refineries, you can increase the production of steel and nuclear fuel!`);
                            m.channel.send(refsteelembed);

                            if(userId!=-1)
                                userSave.users[userId]['comrade']+=3;
                            else
                                m.channel.send(haveNotStarterUserWARNEmbed);

                            //COOLDOWN
                            refinecooldown.add(m.author.id);
                            setTimeout(() => {
                                refinecooldown.delete(m.author.id);
                            },(61200000/(100*(serverSave.servers[serverId]['refineries'])+1200))+10000);
                        }
                        else
                        {
                            var refnotenoughembed = new Discord.MessageEmbed()
                                .setColor('#FF0000')
                                .setTitle(`You don't have enough resources!`)
                                .setDescription(`
                                You can't refine without food or vodka or materials to refine, so go acquire some!
                                For refining metal, the amount is **${steelreffoodreq}** food and **${steelrefvodkareq}** vodka.`);
                            m.channel.send(refnotenoughembed);
                        }
                    }
                    else
                    {
                        m.channel.send(haveNotStartedEmbed);
                    }

                
                }
                break;
//================================================================================================
            case '.refine uranium':
                //COPY THIS
                var serverId=-1;
                for(var i = 0;i<serverSave.servers.length;i++)
                {
                    if(serverSave.servers[i]['id']==m.guild.id)
                    {
                        serverId=i;
                        break;
                    }
                }
                var userId=-1;
                for(var i = 0;i<userSave.users.length;i++)
                {
                    if(userSave.users[i]['id']==m.author.id)
                    {
                        userId=i;
                        break;
                    }
                }
                if(refinecooldown.has(m.author.id))
                {
                    var tempref = serverSave.servers[serverId]['refineries'];
                    var refcooldownstring = `${Math.floor(((61200000/((100*tempref)+1200))+10000)/(60*1000))>0?
                    `${Math.floor(((61200000/((100*tempref)+1200))+10000)/(60*1000))} ${Math.floor(((61200000/((100*tempref)+1200))+10000)/(60*1000))>1?'minutes':'minute'} ${(((61200000/((100*tempref+1200)))+10000)-(Math.floor(((61200000/((100*tempref)+1200))+10000)/(60*1000))*60*1000))/100} seconds`:`${Math.round(((61200000/((100*tempref)+1200))+10000)/1000)} seconds`}`;
                    var refineCooldown = new Discord.MessageEmbed()
                        .setColor("#FF0000")
                        .setTitle(`The refiners are currently cooling.`)
                        .setDescription(`The cooldown for this is ${refcooldownstring}.`);
                    m.channel.send(refineCooldown);
                }
                else
                {
                    if(serverId!=-1)
                    {
                        if(serverSave.servers[serverId]['food']>=steelreffoodreq&&serverSave.servers[serverId]['vodka']>=steelrefvodkareq&&serverSave.servers[serverId]['uranium']!=0)
                        {
                            var currNuclear = Math.round((12/(1+Math.pow(Math.E,((-0.18*serverSave.servers[serverId]['refineries'])+5))))+3);
                            serverSave.servers[serverId]['food']-=uranreffoodreq;
                            serverSave.servers[serverId]['vodka']-=uranrefvodkareq;
                            if(currNuclear>serverSave.servers[serverId]['uranium'])
                            {
                                serverSave.servers[serverId]['nuclear']+=serverSave.servers[serverId]['uranium'];
                                currNuclear = serverSave.servers[serverId]['uranium'];
                                serverSave.servers[serverId]['uranium'] = 0;
                            }
                            else
                            {
                                serverSave.servers[serverId]['uranium']-=currNuclear;
                                serverSave.servers[serverId]['nuclear']+=currNuclear;
                            }

                            var refuranembed = new Discord.MessageEmbed()
                                .setColor('#FF0000')
                                .setTitle(`You've refined ${currNuclear} nuclear fuel for the nation.`)
                                .setDescription(`When you build more refineries, you can increase the production of steel and nuclear fuel!`);
                            m.channel.send(refuranembed);

                            if(userId!=-1)
                                userSave.users[userId]['comrade']+=3;
                            else
                                m.channel.send(haveNotStarterUserWARNEmbed);

                            //COOLDOWN
                            refinecooldown.add(m.author.id);
                            setTimeout(() => {
                                refinecooldown.delete(m.author.id);
                            },(61200000/(100*(serverSave.servers[serverId]['refineries'])+1200))+10000);
                        }
                        else
                        {
                            var refnotenoughembed = new Discord.MessageEmbed()
                                .setColor('#FF0000')
                                .setTitle(`You don't have enough resources!`)
                                .setDescription(`
                                You can't refine without food or vodka or materials to refine, so go acquire some!
                                For refining uranium, the amount is **${uranreffoodreq}** food and **${uranrefvodkareq}** vodka.`);
                            m.channel.send(refnotenoughembed);
                        }
                    }
                    else
                    {
                        m.channel.send(haveNotStartedEmbed);
                    }

                
                }
                break;
//================================================================================================
//-------------------------------------  BUILDING COMMANDS  --------------------------------------
//================================================================================================
//================================================================================================
            case '.build':
                var refnothingembed = new Discord.MessageEmbed()
                    .setColor('#FF0000')
                    .setTitle(`You have to specify what you're building.`)
                    .setDescription(`Run .help to see the stuff you can build.`);
                m.channel.send(refnothingembed);
                break;
//================================================================================================
            case '.build farm':
                //COPY THIS
                var serverId=-1;
                for(var i = 0;i<serverSave.servers.length;i++)
                {
                    if(serverSave.servers[i]['id']==m.guild.id)
                    {
                        serverId=i;
                        break;
                    }
                }
                if(buildbuildingcooldown.has(m.author.id))
                {
                    m.channel.send(buildcooldownembed);
                }
                else
                {
                    if(serverId!=-1)
                    {
                        var cFood = serverSave.servers[serverId]['food'];
                        var cVodka = serverSave.servers[serverId]['vodka'];
                        var cWood = serverSave.servers[serverId]['wood'];
                        var cMetal = serverSave.servers[serverId]['metal'];
                        if(
                            cFood>=buildfarmfood &&
                            cVodka>=buildfarmvodka &&
                            cWood>=buildfarmwood &&
                            cMetal>=buildfarmmetal
                        )
                        {
                            serverSave.servers[serverId]['food']-=buildfarmfood;
                            serverSave.servers[serverId]['vodka']-=buildfarmvodka;
                            serverSave.servers[serverId]['wood']-=buildfarmwood;
                            serverSave.servers[serverId]['metal']-=buildfarmmetal;
                            var buildfarmsuccess = new Discord.MessageEmbed()
                                .setColor('#FF0000')
                                .setTitle(`You've started construction on a farm!`)
                                .setDescription(`It will take 1 minute and 30 seconds to finish building.`);
                            m.channel.send(buildfarmsuccess);

                            //COOLDOWN
                            buildbuildingcooldown.add(m.author.id);
                            setTimeout(() => {
                                buildbuildingcooldown.delete(m.author.id);
                                serverSave.servers[serverId]['farms']+=1;
                            },90000);
                        }
                        else
                        {
                            var buildfarmnotenough = new Discord.MessageEmbed()
                                .setColor('#FF0000')
                                .setTitle('You don\'t have enough resources!')
                                .setDescription(`For building a farm, you need **${buildfarmfood} food, ${buildfarmvodka} vodka, ${buildfarmwood} wood, and ${buildfarmmetal} metal.**`);
                            m.channel.send(buildfarmnotenough);
                        }
                    }
                    else
                    {
                        m.channel.send(haveNotStartedEmbed);
                    }

                
                }
                break;
//================================================================================================
            case '.build distillery':
                //COPY THIS
                var serverId=-1;
                for(var i = 0;i<serverSave.servers.length;i++)
                {
                    if(serverSave.servers[i]['id']==m.guild.id)
                    {
                        serverId=i;
                        break;
                    }
                }
                if(buildbuildingcooldown.has(m.author.id))
                {
                    m.channel.send(buildcooldownembed);
                }
                else
                {
                    if(serverId!=-1)
                    {
                        var cFood = serverSave.servers[serverId]['food'];
                        var cVodka = serverSave.servers[serverId]['vodka'];
                        var cWood = serverSave.servers[serverId]['wood'];
                        var cMetal = serverSave.servers[serverId]['metal'];
                        if(
                            cFood>=builddistillfood &&
                            cVodka>=builddistillvodka &&
                            cWood>=builddistillwood &&
                            cMetal>=builddistillmetal
                        )
                        {
                            serverSave.servers[serverId]['food']-=builddistillfood;
                            serverSave.servers[serverId]['vodka']-=builddistillvodka;
                            serverSave.servers[serverId]['wood']-=builddistillwood;
                            serverSave.servers[serverId]['metal']-=builddistillmetal;
                            var builddistillsuccess = new Discord.MessageEmbed()
                                .setColor('#FF0000')
                                .setTitle(`You've started construction on a distillery!`)
                                .setDescription(`It will take 1 minute and 30 seconds to finish building.`);
                            m.channel.send(builddistillsuccess);

                            //COOLDOWN
                            buildbuildingcooldown.add(m.author.id);
                            setTimeout(() => {
                                buildbuildingcooldown.delete(m.author.id);
                                serverSave.servers[serverId]['distilleries']+=1;
                            },90000);
                        }
                        else
                        {
                            var builddistillnotenough = new Discord.MessageEmbed()
                                .setColor('#FF0000')
                                .setTitle('You don\'t have enough resources!')
                                .setDescription(`For building a distillery, you need **${builddistillfood} food, ${builddistillvodka} vodka, ${builddistillwood} wood, and ${builddistillmetal} metal.**`);
                            m.channel.send(builddistillnotenough);
                        }
                    }
                    else
                    {
                        m.channel.send(haveNotStartedEmbed);
                    }
                }
                break;
//================================================================================================
            case '.build treefarm':
                //COPY THIS
                var serverId=-1;
                for(var i = 0;i<serverSave.servers.length;i++)
                {
                    if(serverSave.servers[i]['id']==m.guild.id)
                    {
                        serverId=i;
                        break;
                    }
                }
                if(buildbuildingcooldown.has(m.author.id))
                {
                    m.channel.send(buildcooldownembed);
                }
                else
                {
                    if(serverId!=-1)
                    {
                        var cFood = serverSave.servers[serverId]['food'];
                        var cVodka = serverSave.servers[serverId]['vodka'];
                        var cWood = serverSave.servers[serverId]['wood'];
                        var cMetal = serverSave.servers[serverId]['metal'];
                        if(
                            cFood>=buildtreefarmfood &&
                            cVodka>=buildtreefarmvodka &&
                            cWood>=buildtreefarmwood &&
                            cMetal>=buildtreefarmmetal
                        )
                        {
                            serverSave.servers[serverId]['food']-=buildtreefarmfood;
                            serverSave.servers[serverId]['vodka']-=buildtreefarmvodka;
                            serverSave.servers[serverId]['wood']-=buildtreefarmwood;
                            serverSave.servers[serverId]['metal']-=buildtreefarmmetal;
                            var buildtreefarmsuccess = new Discord.MessageEmbed()
                                .setColor('#FF0000')
                                .setTitle(`You've started construction on a tree farm!`)
                                .setDescription(`It will take 1 minute and 30 seconds to finish building.`);
                            m.channel.send(buildtreefarmsuccess);

                            //COOLDOWN
                            buildbuildingcooldown.add(m.author.id);
                            setTimeout(() => {
                                buildbuildingcooldown.delete(m.author.id);
                                serverSave.servers[serverId]['treefarms']+=1;
                            },90000);
                        }
                        else
                        {
                            var buildtreefarmnotenough = new Discord.MessageEmbed()
                                .setColor('#FF0000')
                                .setTitle('You don\'t have enough resources!')
                                .setDescription(`For building a tree farm, you need **${buildtreefarmfood} food, ${buildtreefarmvodka} vodka, ${buildtreefarmwood} wood, and ${buildtreefarmmetal} metal.**`);
                            m.channel.send(buildtreefarmnotenough);
                        }
                    }
                    else
                    {
                        m.channel.send(haveNotStartedEmbed);
                    }
                }
                break;
//================================================================================================
            case '.build mine':
                //COPY THIS
                var serverId=-1;
                for(var i = 0;i<serverSave.servers.length;i++)
                {
                    if(serverSave.servers[i]['id']==m.guild.id)
                    {
                        serverId=i;
                        break;
                    }
                }
                if(buildbuildingcooldown.has(m.author.id))
                {
                    m.channel.send(buildcooldownembed);
                }
                else
                {
                    if(serverId!=-1)
                    {
                        var cFood = serverSave.servers[serverId]['food'];
                        var cVodka = serverSave.servers[serverId]['vodka'];
                        var cWood = serverSave.servers[serverId]['wood'];
                        var cMetal = serverSave.servers[serverId]['metal'];
                        var cSteel = serverSave.servers[serverId]['steel'];
                        if(
                            cFood>=buildminefood &&
                            cVodka>=buildminevodka &&
                            cWood>=buildminewood &&
                            cMetal>=buildminemetal &&
                            cSteel>=buildminesteel
                        )
                        {
                            serverSave.servers[serverId]['food']-=buildminefood;
                            serverSave.servers[serverId]['vodka']-=buildminevodka;
                            serverSave.servers[serverId]['wood']-=buildminewood;
                            serverSave.servers[serverId]['metal']-=buildminemetal;
                            serverSave.servers[serverId]['steel']-=buildminesteel;
                            var buildminesuccess = new Discord.MessageEmbed()
                                .setColor('#FF0000')
                                .setTitle(`You've started construction on a mine!`)
                                .setDescription(`It will take 1 minute and 30 seconds to finish building.`);
                            m.channel.send(buildminesuccess);

                            //COOLDOWN
                            buildbuildingcooldown.add(m.author.id);
                            setTimeout(() => {
                                buildbuildingcooldown.delete(m.author.id);
                                serverSave.servers[serverId]['mines']+=1;
                            },90000);
                        }
                        else
                        {
                            var buildminenotenough = new Discord.MessageEmbed()
                                .setColor('#FF0000')
                                .setTitle('You don\'t have enough resources!')
                                .setDescription(`For building a mine, you need **${buildminefood} food, ${buildminevodka} vodka, ${buildminewood} wood, ${buildminemetal} metal, and ${buildminesteel} steel.**`);
                            m.channel.send(buildminenotenough);
                        }
                    }
                    else
                    {
                        m.channel.send(haveNotStartedEmbed);
                    }
                }
                break;
//================================================================================================
            case '.build refinery':
                //COPY THIS
                var serverId=-1;
                for(var i = 0;i<serverSave.servers.length;i++)
                {
                    if(serverSave.servers[i]['id']==m.guild.id)
                    {
                        serverId=i;
                        break;
                    }
                }
                if(buildbuildingcooldown.has(m.author.id))
                {
                    m.channel.send(buildcooldownembed);
                }
                else
                {
                    if(serverId!=-1)
                    {
                        var cFood = serverSave.servers[serverId]['food'];
                        var cVodka = serverSave.servers[serverId]['vodka'];
                        var cWood = serverSave.servers[serverId]['wood'];
                        var cMetal = serverSave.servers[serverId]['metal'];
                        var cSteel = serverSave.servers[serverId]['steel'];
                        if(
                            cFood>=buildrefinefood &&
                            cVodka>=buildrefinevodka &&
                            cWood>=buildrefinewood &&
                            cMetal>=buildrefinemetal &&
                            cSteel>=buildrefinesteel
                        )
                        {
                            serverSave.servers[serverId]['food']-=buildrefinefood;
                            serverSave.servers[serverId]['vodka']-=buildrefinevodka;
                            serverSave.servers[serverId]['wood']-=buildrefinewood;
                            serverSave.servers[serverId]['metal']-=buildrefinemetal;
                            serverSave.servers[serverId]['steel']-=buildrefinesteel;
                            var buildrefinesuccess = new Discord.MessageEmbed()
                                .setColor('#FF0000')
                                .setTitle(`You've started construction on a refinery!`)
                                .setDescription(`It will take 1 minute and 30 seconds to finish building.`);
                            m.channel.send(buildrefinesuccess);

                            //COOLDOWN
                            buildbuildingcooldown.add(m.author.id);
                            setTimeout(() => {
                                buildbuildingcooldown.delete(m.author.id);
                                serverSave.servers[serverId]['refineries']+=1;
                            },90000);
                        }
                        else
                        {
                            var buildrefinenotenough = new Discord.MessageEmbed()
                                .setColor('#FF0000')
                                .setTitle('You don\'t have enough resources!')
                                .setDescription(`For building a refinery, you need **${buildrefinefood} food, ${buildrefinevodka} vodka, ${buildrefinewood} wood, ${buildrefinemetal} metal, and ${buildrefinesteel} steel.**`);
                            m.channel.send(buildrefinenotenough);
                        }
                    }
                    else
                    {
                        m.channel.send(haveNotStartedEmbed);
                    }
                }
                break;
//================================================================================================
            case '.build factory':
                //COPY THIS
                var serverId=-1;
                for(var i = 0;i<serverSave.servers.length;i++)
                {
                    if(serverSave.servers[i]['id']==m.guild.id)
                    {
                        serverId=i;
                        break;
                    }
                }
                if(buildbuildingcooldown.has(m.author.id))
                {
                    m.channel.send(buildcooldownembed);
                }
                else
                {
                    if(serverId!=-1)
                    {
                        var cFood = serverSave.servers[serverId]['food'];
                        var cVodka = serverSave.servers[serverId]['vodka'];
                        var cWood = serverSave.servers[serverId]['wood'];
                        var cMetal = serverSave.servers[serverId]['metal'];
                        var cSteel = serverSave.servers[serverId]['steel'];
                        if(
                            cFood>=buildfactoryfood &&
                            cVodka>=buildfactoryvodka &&
                            cWood>=buildfactorywood &&
                            cMetal>=buildfactorymetal &&
                            cSteel>=buildfactorysteel
                        )
                        {
                            serverSave.servers[serverId]['food']-=buildfactoryfood;
                            serverSave.servers[serverId]['vodka']-=buildfactoryvodka;
                            serverSave.servers[serverId]['wood']-=buildfactorywood;
                            serverSave.servers[serverId]['metal']-=buildfactorymetal;
                            serverSave.servers[serverId]['steel']-=buildfactorysteel;
                            var buildfactorysuccess = new Discord.MessageEmbed()
                                .setColor('#FF0000')
                                .setTitle(`You've started construction on a factory!`)
                                .setDescription(`It will take 1 minute and 30 seconds to finish building.`);
                            m.channel.send(buildfactorysuccess);

                            //COOLDOWN
                            buildbuildingcooldown.add(m.author.id);
                            setTimeout(() => {
                                buildbuildingcooldown.delete(m.author.id);
                                serverSave.servers[serverId]['factories']+=1;
                            },90000);
                        }
                        else
                        {
                            var buildfactorynotenough = new Discord.MessageEmbed()
                                .setColor('#FF0000')
                                .setTitle('You don\'t have enough resources!')
                                .setDescription(`For building a refinery, you need **${buildfactoryfood} food, ${buildfactoryvodka} vodka, ${buildfactorywood} wood, ${buildfactorymetal} metal, and ${buildfactorysteel} steel.**`);
                            m.channel.send(buildfactorynotenough);
                        }
                    }
                    else
                    {
                        m.channel.send(haveNotStartedEmbed);
                    }
                }
                break;
//================================================================================================
            case '.examplefunction':
                //COPY THIS
                var serverId=-1;
                for(var i = 0;i<serverSave.servers.length;i++)
                {
                    if(serverSave.servers[i]['id']==m.guild.id)
                    {
                        serverId=i;
                        break;
                    }
                }
                if(/*cooldownhere.has(m.author.id)*/1==1)
                {

                }
                else
                {
                    if(serverId!=-1)
                    {

                        //COOLDOWN
                        //distillcooldown.add(m.author.id);
                        //setTimeout(() => {
                        //    distillcooldown.delete(m.author.id);
                        //},30000);
                    }
                    else
                    {
                        m.channel.send(haveNotStartedEmbed);
                    }

                
                }
                break;
//================================================================================================
//--------------------------------------  STATUS COMMANDS  ---------------------------------------
//================================================================================================
            case '.empire':
                var serverId=-1;
                for(var i = 0;i<serverSave.servers.length;i++)
                {
                    if(serverSave.servers[i]['id']==m.guild.id)
                    {
                        serverId=i;
                        break;
                    }
                }
                if(serverId!=-1)
                {
                    var empireBuildings = new Discord.MessageEmbed()
                        .setColor('#FF0000')
                        .setTitle('This is your empire\'s buildings.')
                        .setDescription
                        (`
                        Farms: ${serverSave.servers[serverId]['farms']}
                        Distilleries: ${serverSave.servers[serverId]['distilleries']}
                        Tree farms: ${serverSave.servers[serverId]['treefarms']}
                        Mines: ${serverSave.servers[serverId]['mines']}
                        Refineries: ${serverSave.servers[serverId]['refineries']}
                        Factories: ${serverSave.servers[serverId]['factories']}
                        `);
                    m.channel.send(empireBuildings);
                }
                else
                {
                    m.channel.send(haveNotStartedEmbed);
                }
                break;
//================================================================================================
            case '.resources':
                var serverId=-1;
                for(var i = 0;i<serverSave.servers.length;i++)
                {
                    if(serverSave.servers[i]['id']==m.guild.id)
                    {
                        serverId=i;
                        break;
                    }
                }
                if(serverId!=-1)
                {
                    var empireResources = new Discord.MessageEmbed()
                        .setColor('#FF0000')
                        .setTitle('This is your empire\'s resources.')
                        .setDescription
                        (`
                        Food: ${serverSave.servers[serverId]['food']}
                        Vodka: ${serverSave.servers[serverId]['vodka']}
                        Wood: ${serverSave.servers[serverId]['wood']}
                        Metal: ${serverSave.servers[serverId]['metal']}
                        Steel: ${serverSave.servers[serverId]['steel']}
                        Uranium: ${serverSave.servers[serverId]['uranium']}
                        Nuclear Fuel: ${serverSave.servers[serverId]['nuclear']}
                        `);
                    m.channel.send(empireResources);
                }
                else
                {
                    m.channel.send(haveNotStartedEmbed);
                }
                break;
//================================================================================================
            case '.profile':
                var userId=-1;
                for(var i = 0;i<userSave.users.length;i++)
                {
                    if(userSave.users[i]['id']==m.author.id)
                    {
                        userId=i;
                        break;
                    }
                }
                if(userId!=-1)
                {
                    var userResources = new Discord.MessageEmbed()
                        .setColor('#FF0000')
                        .setTitle('This is your profile.')
                        .setDescription
                        (`
                        Comrade Points: ${userSave.users[userId]['comrade']}
                        Glory: ${userSave.users[userId]['glory']}
                        `);
                    m.channel.send(userResources);
                }
                else
                {
                    m.channel.send(haveNotStartedUserEmbed);
                }
                break;
//================================================================================================
            case '.multiplier':
                var globalMultEmbed = new Discord.MessageEmbed()
                    .setColor('#FF0000')
                    .setTitle(`The current global multiplier is ${Math.round(GLOBALMULTIPLIER*100)}%`)
                    .setDescription((GLOBALMULTIPLIER<5?`You can run the command **.boost** to exchange **${boostAmount} comrade points** to boost the global multiplier (all servers running this bot) for 10%!`:'HOLY SHIT I NEED TO NERF THIS'));
                m.channel.send(globalMultEmbed);
                break;
//================================================================================================
            case '.boost':
                var userId=-1;
                for(var i = 0;i<userSave.users.length;i++)
                {
                    if(userSave.users[i]['id']==m.author.id)
                    {
                        userId=i;
                        break;
                    }
                }
                if(userId!=-1)
                {
                    if(userSave.users[userId]['comrade']>=boostAmount)
                    {
                        userSave.users[userId]['comrade']-=boostAmount;
                        GLOBALMULTIPLIER+=0.1;
                        setTimeout(()=>{
                            GLOBALMULTIPLIER-=0.1;
                        },3600000);
                        m.channel.send(boostSuccessfulEmbed);
                    }
                    else
                    {
                        m.channel.send(notEnoughComradeEmbed);
                    }
                }
                else
                {
                    m.channel.send(haveNotStartedUserEmbed);
                }
                break;
//================================================================================================
//----------------------------------------  MISC COMMANDS   --------------------------------------
//================================================================================================
            case '.ussr':
                var sovietAnthem = new Discord.MessageEmbed()
                    .setColor('#FF0000')
                    .setTitle('Soviet Anthem')
                    .setURL('https://www.youtube.com/watch?v=U06jlgpMtQs')
                    .setDescription(`
Soyuz nerushimyy respublik svobodnykh
Splotila naveki Velikaya Rus'.
Da zdravstvuyet sozdannyy voley narodov
Yedinyy, moguchiy Sovetskiy Soyuz!

Slav'sya, Otechestvo nashe svobodnoye,
Druzhby narodov nadozhnyy oplot!
Partiya Lenina - sila narodnaya
Nas k torzhestvu kommunizma vedot!

Skvoz' grozy siyalo nam solntse svobody,
I Lenin velikiy nam put' ozaril,
Na pravoye delo on podnyal narody,
Na trud i na podvigi nas vdokhnovil.

Slav'sya, Otechestvo nashe svobodnoye,
Druzhby narodov nadozhnyy oplot!
Partiya Lenina - sila narodnaya
Nas k torzhestvu kommunizma vedot!

V pobede bessmertnykh idey kommunizma
My vidim gryadushcheye nashey strany
I Krasnomu znameni slavnoy Otchizny
My budem vsegda bezzavetno verny!

Slav'sya, Otechestvo nashe svobodnoye,
Druzhby narodov nadozhnyy oplot!
Partiya Lenina - sila narodnaya
Nas k torzhestvu kommunizma vedot!
                `);
                m.channel.send(sovietAnthem);
                break;
//================================================================================================
            case '.stalinopinion':
                var stalinapproval = Math.floor(Math.random()*2)<1;
                if(stalinapproval)
                    m.channel.send(`Stalin approves of <@${m.author.id}>.`,{
                        files:["https://pbs.twimg.com/profile_images/996162222803087361/NetXPGxP_400x400.jpg"]
                    });
                else
                    m.channel.send(`Stalin does not approve of <@${m.author.id}>. Go to Gulag!`,{
                        files:["https://cdn.images.express.co.uk/img/dynamic/78/590x/381957_1.jpg"]
                    });
                break;
//================================================================================================
            case '.capitalism':
                var userId=-1;
                for(var i = 0;i<userSave.users.length;i++)
                {
                    if(userSave.users[i]['id']==m.author.id)
                    {
                        userId=i;
                        break;
                    }
                }
                if(userId!=-1)
                {
                    userSave.users[userId]['comrade']=0;
                    userSave.users[userId]['glory']=0;
                    m.channel.send("You are a disgrace to this empire! All your comrade points and glory have been removed.");
                }
                break;
//================================================================================================
            case '.changelog':
                var changelogembed = new Discord.MessageEmbed()
                    .setColor('#FF0000')
                    .setTitle('Changelog for CommunismBot')
                    .setDescription(`
                    v0.1.7.2 - saving things works lol plus build distilleries, tree farms and mines
                    v0.1.6 - user system added
                    v0.1.5 - stalinopinion added, refine, and view empire and resources
                    v0.1.3 - added ussr (very important) + dynamic cooldowns
                    v0.1.2 - resource commands
                    `)
                m.channel.send(changelogembed);
                break;
//================================================================================================
//----------------------------------------  DEV COMMANDS  ----------------------------------------
//================================================================================================
            case '..devdebug':
                if(m.author.id=='586779490940747786')
                {
                    m.channel.send(`Server id: ${m.guild.id}`);
                    m.channel.send(`Servers saved: ${serverSave.servers.length}`)
                    console.log(serverSave.servers);
                    console.log(m.author.id);
                }
                break;
//================================================================================================
            case '..devtest':
                if(m.author.id=='586779490940747786')
                {
                    var serverId=-1;
                    for(var i = 0;i<serverSave.servers.length;i++)
                    {
                        if(serverSave.servers[i]['id']==m.guild.id)
                        {
                            serverId=i;
                            break;
                        }
                    }
                    var userId=-1;
                    for(var i = 0;i<userSave.users.length;i++)
                    {
                        if(userSave.users[i]['id']==m.author.id)
                        {
                            userId=i;
                            break;
                        }
                    }
                    if(userId!=-1)
                    {
                        //userSave.users[userId]['comrade']=0;
                    }
                    if(serverId!=-1)
                    {
                        serverSave.servers[serverId]['farms']=81;
                        serverSave.servers[serverId]['distilleries']=31;
                        serverSave.servers[serverId]['wood']=1;
                        serverSave.servers[serverId]['metal']=4;
                        //serverSave.servers[serverId]['food']=10000;
                        m.channel.send("TEST");
                    }
                    else
                    {
                        m.channel.send(haveNotStartedEmbed);
                    }
                }
                break;
//================================================================================================
            case '..makeinfoembed':
                if(m.author.id=='586779490940747786')
                {
                    var infoEmbed = new Discord.MessageEmbed()
                        .setColor('#FF0000')
                        .setTitle(`This server is a **GLORIOUS COMMUNIST NATION**.`)
                        .setDescription(`
                        We are all equal to each other. **Equality is a must here**.
                        Respect your comrades and help each other out to **eradicate the horrible disease that is capitalism.**
                        Mention <@&700785131937464341> or <@!586779490940747786> to get a soviet nickname.
                        **ABSOLUTELY** no racial slurs allowed. All people and races are __equal__ in this server.
                        If you do not follow the instructions above, you will be exiled from this nation.
                        `);
                    m.channel.send(infoEmbed);
                }
                break;
//================================================================================================
            case '..saveandquit':
                if(m.author.id=='586779490940747786')
                {
                    var savestring = JSON.stringify(serverSave.servers);
                    var savestringuser = JSON.stringify(userSave.users);
                    fs.writeFile("saves.json",savestring, function(err, result) {
                        if(err) console.log('error', err);
                    });
                    fs.writeFile("saves-user.json",savestringuser, function(err,result){
                        if(err) console.log('error', err);
                    });
                    m.channel.send("Successfully saved!");
                    setTimeout(()=>{
                        process.exit(1);
                    },10000)
                }
                break;
//================================================================================================
//------------------------------------  PARAMETERIZED COMMANDS  ----------------------------------
//================================================================================================
            default:

        }
    }
});

client.login();
