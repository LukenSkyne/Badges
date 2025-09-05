<p align="center" style="text-align: center">
  <a href="https://github.com/LukenSkyne/Badges">
    <img alt="Badges Logo" src=".github/icon.png" width="128" height="128" />
  </a>
</p>

<h1 align="center">Badges</h1>
<h3 align="center">a customizable badge api with the ability to fetch third-party data</h3>
<br>

<div align="center">

<a href="https://luken.cc/badges/custom?icon=github&bg=00171c|0a1209|100f06|1a0000/100&desc=Taste%20the&name=[5991ee|56ab6c|f5d26a|eb786f/160]Rainbow">![Custom Badge](https://luken.cc/badges/custom?icon=github&bg=00171c|0a1209|100f06|1a0000/100&desc=Taste%20the&name=[5991ee|56ab6c|f5d26a|eb786f/160]Rainbow)</a>

</div>


## About

This project aims to bring some customization options and dynamic into the beauty of [Devin's Badges](https://github.com/intergrav/devins-badges).  
Mostly for personal use in my other repositories, so expect some hiccups here and there. Feel free to report any issues!


## Example Gallery

The following badges are presets, which are also listed in [presets.json](./assets/presets.json).

<a href="https://luken.cc/badges/github">![GitHub](https://luken.cc/badges/github)</a> <a href="https://luken.cc/badges/gitlab">![GitLab](https://luken.cc/badges/gitlab)</a>  
<a href="https://luken.cc/badges/paypal">![PayPal](https://luken.cc/badges/paypal)</a> <a href="https://luken.cc/badges/google-play">![Google Play](https://luken.cc/badges/google-play)</a>  
<a href="https://luken.cc/badges/fabric">![Fabric](https://luken.cc/badges/fabric)</a> <a href="https://luken.cc/badges/forge">![Forge](https://luken.cc/badges/forge)</a>  
<a href="https://luken.cc/badges/curseforge">![CurseForge](https://luken.cc/badges/curseforge)</a> <a href="https://luken.cc/badges/modrinth">![Modrinth](https://luken.cc/badges/modrinth)</a>

The CurseForge and Modrinth badges can also show the download count of your project by appending `/<projectId>` to the URL.

<a href="https://luken.cc/badges/curseforge/734339">![CurseForge](https://luken.cc/badges/curseforge/734339)</a> <a href="https://luken.cc/badges/modrinth/QQXAdCzh">![Modrinth](https://luken.cc/badges/modrinth/QQXAdCzh)</a>

<!-- TODO: Create badge with Duolingo API -->


## How to use

The api currently has a single endpoint which is used to retrieve badges: `https://luken.cc/badges/<preset>`  
A basic preset to start with your own customizations is `custom`, but you can simply override any of them.

The following query parameters can be set:
* `bg` adjusts the background
  * supply a single color with `rgb`
  * add gradient colors by dividing with `|`, such as `rgb|rgb|rgb`
  * rotate the gradient by adding `/angle`, such as `rgb|rgb/45`
* `fill` sets the default icon and text colors (only supports single color)
* `icon` specifies an icon by name (found in the [icons](./assets/icons) folder) or [url encoded](https://www.urlencoder.org/) svg data
* `desc` changes the description text and allows for data fetching
  * limited API support, currently only CurseForge & Modrinth for project information
  * syntax: `{api.json_path|formatter}[Alternate Text] more text`
    * api can be one of `curseforge`, `modrinth`
    * alternate text is shown when the `/<id>` parameter is not used
    * formatter is optionally used for numbers, can be `num` or omitted
* `name` overrides the highlighted name on the right
  * can have multiple segments of differently colored text
  * syntax: `[rgb|rgb/45]Text1[rgb]Text2`

**Note**: color definitions are in hex without `#`, such as `fb4` or `ffb347`.


## Acknowledgements

* [Devin](https://github.com/intergrav/devins-badges) for their awesome badge design
