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

    forwardPorts = [
      {
        protocol = "tcp";
        hostPort = 8889;
        containerPort = 8889;
      }
    ];

    bindMounts."/var/lib/caddy" = {
      hostPath = "/var/lib/caddy-webrtc";
      isReadOnly = false;
    };

    config =
      { ... }:
      {
        services.caddy = {
          enable = true;
          globalConfig = ''
            auto_https disable_redirects
          '';
          dataDir = "/var/lib/caddy";
          virtualHosts."webrtc.odango.app" = {
            extraConfig = ''
              tls /var/lib/caddy/origin-cert.pem /var/lib/caddy/origin-key.pem
              reverse_proxy 10.104.0.2:8889
            '';
          };
        };
      };
  };
}
