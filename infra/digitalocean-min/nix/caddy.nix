{ ... }:
{
  networking.firewall.allowedTCPPorts = [
    80
    443
  ];

  systemd.tmpfiles.rules = [
    "d /var/lib/caddy-webrtc 0755 root root -"
  ];

  containers.caddy = {
    autoStart = true;
    privateNetwork = false;

    bindMounts."/var/lib/caddy" = {
      hostPath = "/var/lib/caddy-webrtc";
      isReadOnly = false;
    };

    config =
      { ... }:
      {
        services.caddy = {
          enable = true;
          dataDir = "/var/lib/caddy";
          virtualHosts."webrtc.odango.app" = {
            extraConfig = ''
              reverse_proxy 127.0.0.1:8889
            '';
          };
        };
      };
  };
}
