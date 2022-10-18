// Alread pre-request root data:
navigatum.getData("root");

navigatum.registerView("main", {
  name: "view-main",
  template: { gulp_inject: "view-main.inc" },
  data: function () {
    return {
      root_data: null,
    };
  },
  beforeRouteEnter: function (to, from, next) {
    navigatum.getData("root").then((data) => next((vm) => vm.setData(data)));
  },
  beforeRouteUpdate: function (to, from, next) {
    // beforeRouteUpdate not used for now since data rarely changes
    next();
  },
  methods: {
    setData: function (data) {
      if (data !== null) navigatum.setTitle(data.name);
      // initalising this sets vue's renering into motion.
      // Because of this, we want to set the values relevant for embeds first, as Rendertron may decide that "we are ready now"
      this.root_data = data;
    },
    more: function (id) {
      document.getElementById(`panel-${id}`).classList.add("open");
    },
    less: function (id) {
      document.getElementById(`panel-${id}`).classList.remove("open");
    },
  },
});