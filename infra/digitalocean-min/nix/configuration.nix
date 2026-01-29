{
  config,
  pkgs,
  modulesPath,
  ...
}:
{
  imports = [
    (modulesPath + "/virtualisation/digital-ocean-config.nix")
    ./mediamtx.nix
  ];

  networking.hostName = "do-1";
  time.timeZone = "Asia/Tokyo";

  services.openssh.enable = true;
  services.openssh.settings.PasswordAuthentication = false;
  services.openssh.settings.PermitRootLogin = "prohibit-password";

  system.stateVersion = "26.05"; # ここはあなたのNixOSの世代に合わせて
}
