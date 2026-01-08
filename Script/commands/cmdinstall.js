const axios = require("axios");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

module.exports.config = {
  name: "install",
  version: "2.0.0",
  hasPermssion: 2,
  credits: "বৃষ্টি দাস", //please don't change credit
  description: "Create/Delete/Load modules",
  commandCategory: "System",
  usages: "[file.js code/link] / [del file.js]",
  cooldowns: 0
};

const loadModule = (nameModule) => {
  try {
    const p = __dirname + "/" + nameModule + ".js";
    delete require.cache[require.resolve(p)];
    const c = require(p);
    if (!c.config || !c.run) throw new Error("Invalid Module");
    global.client.commands.delete(c.config.name);
    global.client.eventRegistered = global.client.eventRegistered.filter(e => e != c.config.name);
    global.client.commands.set(c.config.name, c);
    return true;
  } catch {
    return false;
  }
};

const unloadModule = (nameModule) => {
  global.client.commands.delete(nameModule);
  global.client.eventRegistered = global.client.eventRegistered.filter(e => e !== nameModule);
};

module.exports.run = async ({ api, event, args }) => {
  const { threadID, messageID, senderID } = event;

  if (!["100001039692046", "100089047474463", "61575698041722"].includes(senderID)) {
    return api.sendMessage("Only Boss SAHU us this cmd....", threadID, messageID);
  }

  if (!args[0]) {
    return api.sendMessage("⚠️ Usage: install file.js code/link", threadID, messageID);
  }

  if (args[0] === "del") {
    const file = args[1];
    if (!file || !file.endsWith(".js")) return api.sendMessage("Invalid file.....", threadID, messageID);
    const filePath = path.join(__dirname, file);
    if (!fs.existsSync(filePath)) return api.sendMessage("File not found.....", threadID, messageID);
    unloadModule(file.replace(".js", ""));
    fs.unlinkSync(filePath);
    return api.sendMessage("🗑️ Deleted + Unloaded: " + file, threadID, messageID);
  }

  const fileName = args[0];
  const content = args.slice(1).join(" ");
  if (!fileName.endsWith(".js")) return api.sendMessage("Only .js allowed...⚠️", threadID, messageID);

  const fullPath = path.join(__dirname, fileName);
  if (fs.existsSync(fullPath)) return api.sendMessage("File already exists...⚠️", threadID, messageID);

  let code;
  if (/^(http|https):\/\//.test(content)) {
    try {
      const r = await axios.get(content);
      code = r.data;
    } catch {
      return api.sendMessage("❌ Failed to download code!", threadID, messageID);
    }
  } else {
    code = content;
  }

  try {
    new vm.Script(code);
  } catch (err) {
    return api.sendMessage("❌ Syntax Error: " + err.message, threadID, messageID);
  }

  fs.writeFileSync(fullPath, code, "utf8");

  const name = fileName.replace(".js", "");
  const ok = loadModule(name);

  if (!ok) return api.sendMessage("⚠️ File created but failed to load!", threadID, messageID);

  return api.sendMessage("✅ Successfully Created + Loaded: " + fileName, threadID, messageID);
};
